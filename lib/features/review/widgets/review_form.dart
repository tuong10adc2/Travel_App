import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_theme.dart';
import '../../../l10n/app_localizations.dart';
import '../data/review_repository.dart';
import '../models/review.dart';
import 'star_rating.dart';

class ReviewForm extends ConsumerStatefulWidget {
  const ReviewForm({
    super.key,
    required this.targetType,
    required this.targetId,
    this.existingReview,
  });

  final String targetType;
  final String targetId;
  final Review? existingReview;

  @override
  ConsumerState<ReviewForm> createState() => _ReviewFormState();
}

class _ReviewFormState extends ConsumerState<ReviewForm> {
  late int _rating = widget.existingReview?.rating ?? 0;
  late final _commentController = TextEditingController(text: widget.existingReview?.comment ?? '');
  bool _isSubmitting = false;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context)!;
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.pleaseSelectRating)),
      );
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      await ref.read(reviewRepositoryProvider).submitReview(
            targetType: widget.targetType,
            targetId: widget.targetId,
            rating: _rating,
            comment: _commentController.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.reviewSubmittedPendingApproval)),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(color: context.colors.textSecondary.withOpacity(0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.existingReview == null ? l10n.writeReviewTitle : l10n.editReviewTitle,
            style: Theme.of(context).textTheme.titleSmall,
          ),
          const SizedBox(height: AppSpacing.sm),
          StarRating(rating: _rating.toDouble(), size: 28, onChanged: (v) => setState(() => _rating = v)),
          const SizedBox(height: AppSpacing.sm),
          TextField(
            controller: _commentController,
            maxLines: 3,
            decoration: InputDecoration(hintText: l10n.reviewCommentHint),
          ),
          const SizedBox(height: AppSpacing.sm),
          Align(
            alignment: Alignment.centerRight,
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(widget.existingReview == null ? l10n.submitReviewButton : l10n.updateReviewButton),
            ),
          ),
        ],
      ),
    );
  }
}
