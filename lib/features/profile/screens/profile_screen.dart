import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../auth/data/auth_repository.dart';
import '../providers/profile_providers.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isEditing = false;
  bool _isSaving = false;
  bool _initialized = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  void _startEditing(Map<String, dynamic> data) {
    _nameController.text = (data['displayName'] as String?) ?? '';
    _phoneController.text = (data['phoneNumber'] as String?) ?? '';
    setState(() => _isEditing = true);
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    try {
      await ref.read(authRepositoryProvider).updateProfile(
            displayName: _nameController.text.trim(),
            phoneNumber: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
          );
      if (mounted) setState(() => _isEditing = false);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Cập nhật thất bại, vui lòng thử lại.'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userDoc = ref.watch(currentUserDocProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ cá nhân'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Đăng xuất',
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
          ),
        ],
      ),
      body: userDoc.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text('Lỗi tải hồ sơ: $error')),
        data: (data) {
          if (data == null) {
            return const Center(child: Text('Không tìm thấy thông tin người dùng.'));
          }
          if (!_initialized) {
            _nameController.text = (data['displayName'] as String?) ?? '';
            _phoneController.text = (data['phoneNumber'] as String?) ?? '';
            _initialized = true;
          }

          final photoURL = data['photoURL'] as String?;
          final email = (data['email'] as String?) ?? '';

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Center(
                    child: CircleAvatar(
                      radius: 48,
                      backgroundColor: AppColors.primary.withOpacity(0.1),
                      backgroundImage: photoURL != null ? NetworkImage(photoURL) : null,
                      child: photoURL == null
                          ? const Icon(Icons.person, size: 48, color: AppColors.primary)
                          : null,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  TextFormField(
                    controller: _nameController,
                    enabled: _isEditing,
                    decoration: const InputDecoration(labelText: 'Họ tên'),
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
                    decoration: const InputDecoration(labelText: 'Email'),
                  ),
                  const SizedBox(height: AppSpacing.md),
                  TextFormField(
                    controller: _phoneController,
                    enabled: _isEditing,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'Số điện thoại'),
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
                                      _nameController.text = (data['displayName'] as String?) ?? '';
                                      _phoneController.text = (data['phoneNumber'] as String?) ?? '';
                                    }),
                            child: const Text('Huỷ'),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _save,
                            child: _isSaving
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                  )
                                : const Text('Lưu'),
                          ),
                        ),
                      ],
                    )
                  else
                    ElevatedButton(
                      onPressed: () => _startEditing(data),
                      child: const Text('Sửa thông tin'),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
