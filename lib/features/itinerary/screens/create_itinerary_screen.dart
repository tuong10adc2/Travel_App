import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_theme.dart';
import '../../../core/utils/date_format.dart';
import '../data/itinerary_repository.dart';

class CreateItineraryScreen extends ConsumerStatefulWidget {
  const CreateItineraryScreen({super.key});

  @override
  ConsumerState<CreateItineraryScreen> createState() => _CreateItineraryScreenState();
}

class _CreateItineraryScreenState extends ConsumerState<CreateItineraryScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  DateTime _startDate = DateTime.now();
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _pickStartDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _startDate,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );
    if (picked != null) setState(() => _startDate = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);
    try {
      final id = await ref.read(itineraryRepositoryProvider).createItinerary(
            name: _nameController.text.trim(),
            startDate: _startDate,
          );
      if (mounted) context.pushReplacement('/itineraries/$id');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không tạo được lịch trình: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tạo lịch trình mới')),
      body: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _nameController,
                decoration: const InputDecoration(labelText: 'Tên lịch trình'),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Vui lòng nhập tên lịch trình';
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppSpacing.md),
              InkWell(
                onTap: _pickStartDate,
                child: InputDecorator(
                  decoration: const InputDecoration(labelText: 'Ngày bắt đầu'),
                  child: Row(
                    children: [
                      const Icon(Icons.calendar_today_outlined, size: 18, color: AppColors.textSecondary),
                      const SizedBox(width: AppSpacing.sm),
                      Text(formatDateVi(_startDate)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              ElevatedButton(
                onPressed: _isSubmitting ? null : _submit,
                child: _isSubmitting
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Tạo lịch trình'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
