import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trang chủ'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person_outline),
            tooltip: 'Hồ sơ cá nhân',
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: const Center(
        child: Text('Danh sách địa điểm sẽ hiển thị ở đây'),
      ),
    );
  }
}
