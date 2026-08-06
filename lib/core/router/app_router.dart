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
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/profile',
        builder: (context, state) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/place/:id',
        builder: (context, state) => PlaceDetailScreen(placeId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/place/:id/vr360',
        builder: (context, state) => Vr360ViewerScreen(
          placeId: state.pathParameters['id']!,
          initialMediaId: state.uri.queryParameters['mediaId'],
        ),
      ),
      GoRoute(
        path: '/saved',
        builder: (context, state) => const SavedPlacesScreen(),
      ),
      GoRoute(
        path: '/itineraries',
        builder: (context, state) => const ItineraryListScreen(),
      ),
      GoRoute(
        path: '/itineraries/new',
        builder: (context, state) => const CreateItineraryScreen(),
      ),
      GoRoute(
        path: '/itineraries/:id',
        builder: (context, state) => ItineraryDetailScreen(itineraryId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/itineraries/:id/add-place',
        builder: (context, state) => AddPlaceToItineraryScreen(
          itineraryId: state.pathParameters['id']!,
          dayIndex: int.tryParse(state.uri.queryParameters['day'] ?? '') ?? 0,
        ),
      ),
      GoRoute(
        path: '/chat',
        builder: (context, state) => const ChatScreen(),
      ),
      GoRoute(
        path: '/tours',
        builder: (context, state) => const TourListScreen(),
      ),
      GoRoute(
        path: '/tours/:id',
        builder: (context, state) => TourDetailScreen(tourId: state.pathParameters['id']!),
      ),
    ],
  );
});
