import 'package:flutter/material.dart';

import '../../../core/theme/app_theme.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.travel_explore, size: 64, color: AppColors.primary),
            SizedBox(height: AppSpacing.md),
            Text('Trợ lý du lịch AI', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            SizedBox(height: AppSpacing.lg),
            CircularProgressIndicator(color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
