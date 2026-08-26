import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/screens/forgot_password_screen.dart';
import '../../features/auth/screens/login_screen.dart';
import '../../features/auth/screens/register_screen.dart';
import '../../features/auth/screens/splash_screen.dart';
import '../../features/chat/screens/chat_screen.dart';
import '../../features/home/screens/home_screen.dart';
import '../../features/itinerary/screens/add_place_to_itinerary_screen.dart';
import '../../features/itinerary/screens/create_itinerary_screen.dart';
import '../../features/itinerary/screens/itinerary_detail_screen.dart';
import '../../features/itinerary/screens/itinerary_list_screen.dart';
import '../../features/place_detail/screens/place_detail_screen.dart';
import '../../features/profile/screens/profile_screen.dart';
import '../../features/saved/screens/saved_places_screen.dart';
import '../../features/tours/screens/tour_detail_screen.dart';
import '../../features/tours/screens/tour_list_screen.dart';
import '../../features/vr360/screens/vr360_viewer_screen.dart';
import 'fade_scale_page.dart';
import 'main_shell.dart';

const _authRoutes = ['/login', '/register', '/forgot-password'];

final appRouterProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateChangesProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      if (authState.isLoading) return null;

      final isLoggedIn = authState.valueOrNull != null;
      final path = state.matchedLocation;
      final isAuthRoute = _authRoutes.contains(path);

      if (!isLoggedIn) {
        return isAuthRoute ? null : '/login';
      }
      if (isAuthRoute || path == '/') {
        return '/home';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/',
        pageBuilder: (context, state) =>
            fadeScalePage(key: state.pageKey, child: const SplashScreen()),
      ),
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) =>
            fadeScalePage(key: state.pageKey, child: const LoginScreen()),
      ),
      GoRoute(
        path: '/register',
        pageBuilder: (context, state) =>
            fadeScalePage(key: state.pageKey, child: const RegisterScreen()),
      ),
      GoRoute(
        path: '/forgot-password',
        pageBuilder: (context, state) => fadeScalePage(
            key: state.pageKey, child: const ForgotPasswordScreen()),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/home', builder: (context, state) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/tours',
                builder: (context, state) => const TourListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/itineraries',
                builder: (context, state) => const ItineraryListScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/chat', builder: (context, state) => const ChatScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/saved',
                builder: (context, state) => const SavedPlacesScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen()),
          ]),
        ],
      ),
      GoRoute(
        path: '/place/:id',
        pageBuilder: (context, state) => fadeScalePage(
          key: state.pageKey,
          child: PlaceDetailScreen(placeId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/place/:id/vr360',
        pageBuilder: (context, state) => fadeScalePage(
          key: state.pageKey,
          child: Vr360ViewerScreen(
            placeId: state.pathParameters['id']!,
            initialMediaId: state.uri.queryParameters['mediaId'],
          ),
        ),
      ),
      GoRoute(
        path: '/itineraries/new',
        pageBuilder: (context, state) => fadeScalePage(
            key: state.pageKey, child: const CreateItineraryScreen()),
      ),
      GoRoute(
        path: '/itineraries/:id',
        pageBuilder: (context, state) => fadeScalePage(
          key: state.pageKey,
          child:
              ItineraryDetailScreen(itineraryId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/itineraries/:id/add-place',
        pageBuilder: (context, state) => fadeScalePage(
          key: state.pageKey,
          child: AddPlaceToItineraryScreen(
            itineraryId: state.pathParameters['id']!,
            dayIndex: int.tryParse(state.uri.queryParameters['day'] ?? '') ?? 0,
          ),
        ),
      ),
      GoRoute(
        path: '/tours/:id',
        pageBuilder: (context, state) => fadeScalePage(
          key: state.pageKey,
          child: TourDetailScreen(tourId: state.pathParameters['id']!),
        ),
      ),
    ],
  );
});
