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
            Image(
              image: AssetImage('assets/images/logo.png'),
              width: 96,
              height: 96,
            ),
            SizedBox(height: AppSpacing.md),
            Text('TngGuide', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600)),
            SizedBox(height: AppSpacing.lg),
            CircularProgressIndicator(color: AppColors.primary),
          ],
        ),
      ),
    );
  }
}
