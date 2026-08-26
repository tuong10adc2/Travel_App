import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../../../core/widgets/background_blobs.dart';
import '../../../core/widgets/pressable_scale.dart';
import '../../../core/widgets/skeleton_loaders.dart';
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
          const SnackBar(
              content: Text('Cập nhật thất bại, vui lòng thử lại.'),
              backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userDoc = ref.watch(currentUserDocProvider);
    final colors = context.colors;

    return Scaffold(
      appBar: AppBar(title: const Text('Hồ sơ cá nhân')),
      body: DecorativeBackground(
        child: userDoc.when(
          loading: () => const SkeletonDetailPage(),
          error: (error, _) => Center(child: Text('Lỗi tải hồ sơ: $error')),
          data: (data) {
            if (data == null) {
              return const Center(
                  child: Text('Không tìm thấy thông tin người dùng.'));
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
                ? 'Thành viên từ ${formatDateVi(createdAt.toDate())}'
                : null;

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
                            : 'Bạn du lịch',
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
                                const InputDecoration(labelText: 'Họ tên'),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Vui lòng nhập họ tên';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppSpacing.md),
                          TextFormField(
                            initialValue: email,
                            enabled: false,
                            decoration:
                                const InputDecoration(labelText: 'Email'),
                          ),
                          const SizedBox(height: AppSpacing.md),
                          TextFormField(
                            controller: _phoneController,
                            enabled: _isEditing,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                                labelText: 'Số điện thoại'),
                          ),
                          const SizedBox(height: AppSpacing.lg),
                          Text('Sở thích du lịch',
                              style: Theme.of(context).textTheme.titleSmall),
                          const SizedBox(height: 2),
                          Text(
                            'Giúp trợ lý AI gợi ý địa điểm sát với bạn hơn.',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          const SizedBox(height: AppSpacing.sm),
                          Wrap(
                            spacing: AppSpacing.xs,
                            runSpacing: AppSpacing.xs,
                            children: [
                              for (final tag in _preferenceTags)
                                FilterChip(
                                  label: Text(tag),
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
                                    child: const Text('Huỷ'),
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
                                          : const Text('Lưu'),
                                    ),
                                  ),
                                ),
                              ],
                            )
                          else
                            PressableScale(
                              child: ElevatedButton(
                                onPressed: () => _startEditing(data),
                                child: const Text('Sửa thông tin'),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                OutlinedButton.icon(
                  onPressed: () => ref.read(authRepositoryProvider).signOut(),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                  ),
                  icon: const Icon(Icons.logout),
                  label: const Text('Đăng xuất'),
                ),
              ],
            );
          },
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
    return _StatCard(icon: Icons.bookmark, label: 'Đã lưu', count: count);
  }
}

class _ItineraryCountCard extends ConsumerWidget {
  const _ItineraryCountCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(myItinerariesProvider).valueOrNull?.length ?? 0;
    return _StatCard(
        icon: Icons.calendar_month, label: 'Lịch trình', count: count);
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
