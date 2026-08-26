import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../../../core/utils/tag_labels.dart';
import '../../../core/widgets/background_blobs.dart';
import '../../../core/widgets/pressable_scale.dart';
import '../../../core/widgets/skeleton_loaders.dart';
import '../../../l10n/app_localizations.dart';
import '../../auth/data/auth_repository.dart';
import '../../itinerary/providers/itinerary_providers.dart';
import '../../saved/providers/saved_providers.dart';
import '../providers/profile_providers.dart';

const _preferenceTags = [
  'Lịch sử',
  'Ẩm thực',
  'Thiên nhiên',
  'Văn hoá',
  'Biển đảo',
  'Núi rừng'
];

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  Set<String> _selectedPreferences = {};
  bool _isEditing = false;
  bool _isSaving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  List<String> _preferencesOf(Map<String, dynamic> data) {
    return ((data['preferences'] as List?) ?? const []).cast<String>();
  }

  void _startEditing(Map<String, dynamic> data) {
    _nameController.text = (data['displayName'] as String?) ?? '';
    _phoneController.text = (data['phoneNumber'] as String?) ?? '';
    setState(() {
      _selectedPreferences = _preferencesOf(data).toSet();
      _isEditing = true;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    try {
      await ref.read(authRepositoryProvider).updateProfile(
            displayName: _nameController.text.trim(),
            phoneNumber: _phoneController.text.trim().isEmpty
                ? null
                : _phoneController.text.trim(),
            preferences: _selectedPreferences.toList(),
          );
      if (mounted) setState(() => _isEditing = false);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(AppLocalizations.of(context)!.updateProfileFailedMessage),
              backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  /// Đổi ngôn ngữ app: ghi lên `users/{uid}.language` qua cùng `updateProfile`
  /// dùng chung với phần sửa hồ sơ — `localeProvider` (watch Firestore doc)
  /// sẽ tự cập nhật `MaterialApp.locale` ngay khi stream emit giá trị mới.
  /// Giữ nguyên displayName/phoneNumber hiện có vì `updateProfile` luôn ghi
  /// đè field `phoneNumber` (không có `if != null` như `preferences`).
  Future<void> _setLanguage(Map<String, dynamic> data, String language) async {
    try {
      await ref.read(authRepositoryProvider).updateProfile(
            displayName: (data['displayName'] as String?) ?? '',
            phoneNumber: data['phoneNumber'] as String?,
            language: language,
          );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(AppLocalizations.of(context)!.updateProfileFailedMessage),
              backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final userDoc = ref.watch(currentUserDocProvider);
    final colors = context.colors;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profileTitle)),
      body: DecorativeBackground(
        child: userDoc.when(
          loading: () => const SkeletonDetailPage(),
          error: (error, _) => Center(child: Text(l10n.profileLoadError(error))),
          data: (data) {
            if (data == null) {
              return Center(child: Text(l10n.userInfoNotFound));
            }
            if (!_initialized) {
              _nameController.text = (data['displayName'] as String?) ?? '';
              _phoneController.text = (data['phoneNumber'] as String?) ?? '';
              _selectedPreferences = _preferencesOf(data).toSet();
              _initialized = true;
            }

            final photoURL = data['photoURL'] as String?;
            final email = (data['email'] as String?) ?? '';
            final createdAt = data['createdAt'];
            final joinedLabel = createdAt is Timestamp
                ? l10n.memberSince(formatDateVi(createdAt.toDate()))
                : null;
            final currentLanguage = (data['language'] as String?) ?? 'vi';

            return ListView(
              padding: const EdgeInsets.all(AppSpacing.lg),
              children: [
                Center(
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                              colors: [AppColors.secondary, AppColors.primary]),
                        ),
                        child: CircleAvatar(
                          radius: 44,
                          backgroundColor: colors.surface,
                          backgroundImage:
                              photoURL != null ? NetworkImage(photoURL) : null,
                          child: photoURL == null
                              ? const Icon(Icons.person,
                                  size: 40, color: AppColors.primary)
                              : null,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        (data['displayName'] as String?)?.isNotEmpty == true
                            ? data['displayName'] as String
                            : l10n.defaultTravelerName,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text(email, style: Theme.of(context).textTheme.bodySmall),
                      if (joinedLabel != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          joinedLabel,
                          style: Theme.of(context)
                              .textTheme
                              .labelSmall
                              ?.copyWith(color: colors.textSecondary),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                const Row(
                  children: [
                    Expanded(child: _SavedCountCard()),
                    SizedBox(width: AppSpacing.sm),
                    Expanded(child: _ItineraryCountCard()),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
                Form(
                  key: _formKey,
                  child: Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          TextFormField(
                            controller: _nameController,
                            enabled: _isEditing,
                            decoration:
                                InputDecoration(labelText: l10n.fullNameLabel),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return l10n.fullNameRequiredError;
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppSpacing.md),
                          TextFormField(
                            initialValue: email,
                            enabled: false,
                            decoration:
                                InputDecoration(labelText: l10n.emailLabel),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          TextFormField(
                            controller: _phoneController,
                            enabled: _isEditing,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                                labelText: l10n.phoneNumberLabel),
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          Text(l10n.travelPreferencesHeading,
                              style: Theme.of(context).textTheme.titleSmall),
                          const SizedBox(height: 2),
                          Text(
                            l10n.travelPreferencesSubtitle,
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Wrap(
                            spacing: AppSpacing.xs,
                            runSpacing: AppSpacing.xs,
                            children: [
                              for (final tag in _preferenceTags)
                                FilterChip(
                                  label: Text(tagLabel(context, tag)),
                                  selected: _selectedPreferences.contains(tag),
                                  onSelected: _isEditing
                                      ? (value) => setState(() {
                                            if (value) {
                                              _selectedPreferences.add(tag);
                                            } else {
                                              _selectedPreferences.remove(tag);
                                            }
                                          })
                                      : null,
                                  selectedColor:
                                      AppColors.primary.withOpacity(0.16),
                                  checkmarkColor: AppColors.primary,
                                  labelStyle: TextStyle(
                                    color: _selectedPreferences.contains(tag)
                                        ? AppColors.primary
                                        : null,
                                    fontWeight:
                                        _selectedPreferences.contains(tag)
                                            ? FontWeight.w600
                                            : null,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          if (_isEditing)
                            Row(
                              children: [
                                Expanded(
                                  child: OutlinedButton(
                                    onPressed: _isSaving
                                        ? null
                                        : () => setState(() {
                                              _isEditing = false;
                                              _nameController.text =
                                                  (data['displayName']
                                                          as String?) ??
                                                      '';
                                              _phoneController.text =
                                                  (data['phoneNumber']
                                                          as String?) ??
                                                      '';
                                              _selectedPreferences =
                                                  _preferencesOf(data).toSet();
                                            }),
                                    child: Text(l10n.cancel),
                                  ),
                                ),
                                const SizedBox(width: AppSpacing.md),
                                Expanded(
                                  child: PressableScale(
                                    child: ElevatedButton(
                                      onPressed: _isSaving ? null : _save,
                                      child: _isSaving
                                          ? const SizedBox(
                                              height: 20,
                                              width: 20,
                                              child: CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                  color: Colors.white),
                                            )
                                          : Text(l10n.save),
                                    ),
                                  ),
                                ),
                              ],
                            )
                          else
                            PressableScale(
                              child: ElevatedButton(
                                onPressed: () => _startEditing(data),
                                child: Text(l10n.editProfileButton),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                _LanguageCard(
                  currentLanguage: currentLanguage,
                  onSelect: (language) => _setLanguage(data, language),
                ),
                const SizedBox(height: AppSpacing.lg),
                OutlinedButton.icon(
                  onPressed: () => ref.read(authRepositoryProvider).signOut(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                  icon: const Icon(Icons.logout),
                  label: Text(l10n.logout),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

/// Chọn ngôn ngữ app (Tiếng Việt / English) — cùng "ngôn ngữ hình ảnh" với
/// phần hồ sơ phía trên (Card + FilterChip). Lưu trực tiếp lên Firestore qua
/// `_setLanguage` (không cần vào chế độ sửa) để đổi ngay lập tức.
class _LanguageCard extends StatelessWidget {
  const _LanguageCard({required this.currentLanguage, required this.onSelect});

  final String currentLanguage;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.languageSectionTitle,
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: [
                FilterChip(
                  label: Text(l10n.languageVietnamese),
                  selected: currentLanguage == 'vi',
                  onSelected: (_) => onSelect('vi'),
                  selectedColor: AppColors.primary.withOpacity(0.16),
                  checkmarkColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: currentLanguage == 'vi' ? AppColors.primary : null,
                    fontWeight:
                        currentLanguage == 'vi' ? FontWeight.w600 : null,
                  ),
                ),
                FilterChip(
                  label: Text(l10n.languageEnglish),
                  selected: currentLanguage == 'en',
                  onSelected: (_) => onSelect('en'),
                  selectedColor: AppColors.primary.withOpacity(0.16),
                  checkmarkColor: AppColors.primary,
                  labelStyle: TextStyle(
                    color: currentLanguage == 'en' ? AppColors.primary : null,
                    fontWeight:
                        currentLanguage == 'en' ? FontWeight.w600 : null,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _SavedCountCard extends ConsumerWidget {
  const _SavedCountCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(savedPlacesProvider).valueOrNull?.length ?? 0;
    return _StatCard(icon: Icons.bookmark, label: AppLocalizations.of(context)!.navSaved, count: count);
  }
}

class _ItineraryCountCard extends ConsumerWidget {
  const _ItineraryCountCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(myItinerariesProvider).valueOrNull?.length ?? 0;
    return _StatCard(
        icon: Icons.calendar_month, label: AppLocalizations.of(context)!.navItineraries, count: count);
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard(
      {required this.icon, required this.label, required this.count});

  final IconData icon;
  final String label;
  final int count;

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          const Positioned.fill(child: PatternOverlay(opacity: 0.7)),
          Padding(
            padding: const EdgeInsets.symmetric(
                vertical: AppSpacing.md, horizontal: AppSpacing.sm),
            child: Column(
              children: [
                Icon(icon, color: AppColors.primary, size: 22),
                const SizedBox(height: 4),
                Text('$count', style: Theme.of(context).textTheme.titleLarge),
                Text(label, style: Theme.of(context).textTheme.labelSmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
