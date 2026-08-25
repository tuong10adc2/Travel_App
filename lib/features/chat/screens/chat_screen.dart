import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/pressable_scale.dart';
import '../../../core/widgets/skeleton_loaders.dart';
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
    final priorMessages = ref.read(chatMessagesProvider).valueOrNull ?? const [];

    _inputController.clear();
    ref.read(isChatWaitingForReplyProvider.notifier).state = true;
    _scrollToBottom();

    try {
      await ref.read(chatRepositoryProvider).sendMessage(text: text, priorMessages: priorMessages);
    } on FirebaseFunctionsException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message ?? 'Đã có lỗi khi gọi trợ lý AI.'), backgroundColor: AppColors.error),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Đã có lỗi: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) ref.read(isChatWaitingForReplyProvider.notifier).state = false;
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(chatMessagesProvider);
    final isWaiting = ref.watch(isChatWaitingForReplyProvider);

    ref.listen(chatMessagesProvider, (previous, next) {
      if ((next.valueOrNull?.length ?? 0) != (previous?.valueOrNull?.length ?? 0)) {
        _scrollToBottom();
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('Trợ lý du lịch AI')),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              loading: () => const SkeletonList(itemCount: 4),
              error: (error, _) => Center(child: Text('Lỗi tải hội thoại: $error')),
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
                      return const _TypingIndicator();
                    }
                    return ChatMessageBubble(message: messages[index]);
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
                      decoration: const InputDecoration(hintText: 'Hỏi về địa điểm, lịch trình...'),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  PressableScale(
                    child: IconButton.filled(
                      onPressed: isWaiting ? null : _send,
                      icon: const Icon(Icons.send),
                      style: IconButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WelcomeState extends StatelessWidget {
  const _WelcomeState();

  @override
  Widget build(BuildContext context) {
    return const EmptyState(
      icon: Icons.smart_toy_outlined,
      title: 'Trợ lý du lịch AI',
      message: 'Hỏi mình về địa điểm, lên lịch trình hay mẹo du lịch nhé!',
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
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        decoration: BoxDecoration(
          color: context.colors.surface,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: context.colors.textSecondary.withOpacity(0.15)),
        ),
        child: const SizedBox(
          width: 20,
          height: 14,
          child: Center(child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))),
        ),
      ),
    );
  }
}
