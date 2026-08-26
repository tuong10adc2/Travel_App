import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/widgets/pressable_scale.dart';
import '../../../l10n/app_localizations.dart';
import '../data/saved_place_repository.dart';
import '../providers/saved_providers.dart';

class SaveToggleButton extends ConsumerStatefulWidget {
  const SaveToggleButton({super.key, required this.placeId});

  final String placeId;

  @override
  ConsumerState<SaveToggleButton> createState() => _SaveToggleButtonState();
}

class _SaveToggleButtonState extends ConsumerState<SaveToggleButton> {
  bool _isToggling = false;

  Future<void> _toggle() async {
    setState(() => _isToggling = true);
    try {
      await ref.read(savedPlaceRepositoryProvider).toggleSave(widget.placeId);
    } finally {
      if (mounted) setState(() => _isToggling = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isSaved = ref.watch(isPlaceSavedProvider(widget.placeId));

    return PressableScale(
      child: IconButton(
        onPressed: _isToggling ? null : _toggle,
        icon: Icon(isSaved ? Icons.favorite : Icons.favorite_border),
        color: isSaved ? Colors.redAccent : Colors.white,
        tooltip: isSaved
            ? AppLocalizations.of(context)!.unsaveTooltip
            : AppLocalizations.of(context)!.saveTooltip,
      ),
    );
  }
}
