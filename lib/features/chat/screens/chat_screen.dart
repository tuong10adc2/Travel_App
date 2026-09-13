import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/background_blobs.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/fade_slide_in.dart';
import '../../../core/widgets/pressable_scale.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
import '../data/chat_repository.dart';
import '../providers/chat_providers.dart';
import '../widgets/chat_message_bubble.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _inputController = TextEditingController();
  final _scrollController = ScrollController();
  String? _streamingText;

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (!_scrollController.hasClients) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_scrollController.hasClients) return;
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
      );
    });
  }

  Future<void> _send() async {
    final text = _inputController.text.trim();
    if (text.isEmpty) return;
    final priorMessages =
        ref.read(chatMessagesProvider).valueOrNull ?? const [];

    _inputController.clear();
    ref.read(isChatWaitingForReplyProvider.notifier).state = true;
    _scrollToBottom();

    try {
      await ref.read(chatRepositoryProvider).sendMessage(
            text: text,
            priorMessages: priorMessages,
            onTextDelta: (textSoFar) {
              if (!mounted) return;
              setState(() => _streamingText = textSoFar);
              _scrollToBottom();
            },
          );
    } on StateError catch (e) {
      if (mounted) {
        final l10n = AppLocalizations.of(context)!;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(e.message.isNotEmpty
                  ? e.message
                  : l10n.chatFunctionErrorFallback),
              backgroundColor: AppColors.error),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(AppLocalizations.of(context)!.chatGenericError(e)),
              backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) {
        ref.read(isChatWaitingForReplyProvider.notifier).state = false;
        setState(() => _streamingText = null);
      }
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(chatMessagesProvider);
    final isWaiting = ref.watch(isChatWaitingForReplyProvider);
    final l10n = AppLocalizations.of(context)!;

    ref.listen(chatMessagesProvider, (previous, next) {
      if ((next.valueOrNull?.length ?? 0) !=
          (previous?.valueOrNull?.length ?? 0)) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      appBar: AppBar(title: Text(l10n.appTitle)),
      body: DecorativeBackground(
        child: Column(
          children: [
            Expanded(
              child: messagesAsync.when(
                loading: () => const SkeletonList(itemCount: 4),
                error: (error, _) =>
                    Center(child: Text(l10n.chatLoadError(error))),
                data: (messages) {
                  if (messages.isEmpty && !isWaiting) {
                    return const _WelcomeState();
                  }
                  return ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(AppSpacing.md),
                    itemCount: messages.length + (isWaiting ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index >= messages.length) {
                        return _streamingText != null && _streamingText!.isNotEmpty
                            ? _StreamingBubble(text: _streamingText!)
                            : const _TypingIndicator();
                      }
                      return FadeSlideIn(
                          child: ChatMessageBubble(message: messages[index]));
                    },
                  );
                },
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _inputController,
                        minLines: 1,
                        maxLines: 4,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => _send(),
                        decoration:
                            InputDecoration(hintText: l10n.chatInputHint),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    PressableScale(
                      child: IconButton.filled(
                        onPressed: isWaiting ? null : _send,
                        icon: const Icon(Icons.send),
                        style: IconButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WelcomeState extends StatelessWidget {
  const _WelcomeState();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return EmptyState(
      icon: Icons.smart_toy_outlined,
      illustrationAsset: 'assets/illustrations/empty_chat.svg',
      title: l10n.appTitle,
      message: l10n.chatWelcomeMessage,
    );
  }
}

/// Bong bóng tạm hiện chữ AI đang gõ dần (chưa ghi Firestore — chỉ ghi 1 lần khi stream xong).
class _StreamingBubble extends StatelessWidget {
  const _StreamingBubble({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: context.colors.textSecondary.withOpacity(0.15)),
        ),
        child: Text(text, style: Theme.of(context).textTheme.bodyLarge),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border:
              Border.all(color: context.colors.textSecondary.withOpacity(0.15)),
        ),
        child: const SizedBox(
          width: 20,
          height: 14,
          child: Center(
              child: SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2))),
        ),
      ),
    );
  }
}
