import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'AI Travel Assistant';

  @override
  String get navExplore => 'Explore';

  @override
  String get navTours => 'Tours';

  @override
  String get navItineraries => 'Itinerary';

  @override
  String get navChat => 'Assistant';

  @override
  String get navSaved => 'Saved';

  @override
  String get navProfile => 'Profile';

  @override
  String get login => 'Log in';

  @override
  String get register => 'Sign up';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailInvalidError => 'Please enter a valid email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get passwordTooShortError => 'Password must be at least 6 characters';

  @override
  String get forgotPasswordLink => 'Forgot password?';

  @override
  String get loginWithGoogle => 'Sign in with Google';

  @override
  String get noAccountRegisterNow => 'Don\'t have an account? Sign up now';

  @override
  String get fullNameLabel => 'Full name';

  @override
  String get fullNameRequiredError => 'Please enter your full name';

  @override
  String get confirmPasswordLabel => 'Confirm password';

  @override
  String get confirmPasswordMismatchError => 'Passwords do not match';

  @override
  String get haveAccountLoginNow => 'Already have an account? Log in';

  @override
  String get forgotPasswordTitle => 'Forgot password';

  @override
  String get forgotPasswordInstructions => 'Enter your registered email and we\'ll send you a password reset link.';

  @override
  String get sendResetEmailButton => 'Send reset email';

  @override
  String get resetEmailSentMessage => 'Password reset email sent, please check your inbox.';

  @override
  String get authErrorInvalidEmail => 'Invalid email.';

  @override
  String get authErrorUserDisabled => 'This account has been disabled.';

  @override
  String get authErrorUserNotFound => 'No account found with this email.';

  @override
  String get authErrorWrongPassword => 'Incorrect email or password.';

  @override
  String get authErrorEmailInUse => 'This email is already registered.';

  @override
  String get authErrorWeakPassword => 'Password is too weak, it must be at least 6 characters.';

  @override
  String get authErrorOperationNotAllowed => 'This sign-in method is not enabled.';

  @override
  String get authErrorTooManyRequests => 'Too many attempts, please try again later.';

  @override
  String get authErrorNetworkFailed => 'Network error, please try again.';

  @override
  String authErrorGeneric(String code) {
    return 'Something went wrong ($code), please try again.';
  }

  @override
  String chatLoadError(Object error) {
    return 'Failed to load conversation: $error';
  }

  @override
  String get chatFunctionErrorFallback => 'Something went wrong while reaching the AI assistant.';

  @override
  String chatGenericError(Object error) {
    return 'Something went wrong: $error';
  }

  @override
  String get chatInputHint => 'Ask about places, itineraries...';

  @override
  String get chatWelcomeMessage => 'Ask me about places, planning an itinerary, or travel tips!';

  @override
  String dayLabel(Object number) {
    return 'Day $number';
  }

  @override
  String get createItineraryFromSuggestion => 'Create itinerary from this suggestion';

  @override
  String get aiSuggestedItineraryName => 'AI-suggested itinerary';

  @override
  String get itineraryNameLabel => 'Itinerary name';

  @override
  String get startDateLabel => 'Start date';

  @override
  String get cancel => 'Cancel';

  @override
  String get createItineraryButton => 'Create itinerary';

  @override
  String createItineraryError(Object error) {
    return 'Couldn\'t create itinerary: $error';
  }

  @override
  String get tagHistory => 'History';

  @override
  String get tagCuisine => 'Cuisine';

  @override
  String get tagNature => 'Nature';

  @override
  String get tagCulture => 'Culture';

  @override
  String get tagBeach => 'Beaches & Islands';

  @override
  String get tagMountain => 'Mountains & Forests';

  @override
  String get filterAll => 'All';

  @override
  String get recommendedForYou => 'Recommended for you';

  @override
  String placesLoadError(Object error) {
    return 'Failed to load places: $error';
  }

  @override
  String get noMatchingPlacesFound => 'No matching places found';

  @override
  String get profileTitle => 'My Profile';

  @override
  String get searchPlacesHint => 'Search places...';

  @override
  String get discoverNewJourney => 'Discover new journeys';

  @override
  String get suggestedPlacesForYou => 'Places picked just for your trip';

  @override
  String durationHours(String hours) {
    return '$hours hr';
  }

  @override
  String durationMinutes(Object minutes) {
    return '$minutes min';
  }

  @override
  String get free => 'Free';

  @override
  String get myItinerariesTitle => 'My Itineraries';

  @override
  String get noItinerariesYetTitle => 'No itineraries yet';

  @override
  String get noItinerariesYetMessage => 'Tap \"Create itinerary\" to start planning your trip.';

  @override
  String dayCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count days',
      one: '$count day',
    );
    return '$_temp0';
  }

  @override
  String itineraryLoadError(Object error) {
    return 'Failed to load itinerary: $error';
  }

  @override
  String get itineraryFallbackTitle => 'Itinerary';

  @override
  String get itineraryNotFound => 'Itinerary not found.';

  @override
  String get addDayButton => 'Add day';

  @override
  String get addPlaceButton => 'Add place';

  @override
  String get emptyDayMessage => 'No places added to this day yet.\nTap \"Add place\" below.';

  @override
  String get placeNoLongerExists => '(This place no longer exists)';

  @override
  String get removeFromItineraryTooltip => 'Remove from itinerary';

  @override
  String get createItineraryTitle => 'Create new itinerary';

  @override
  String get itineraryNameRequiredError => 'Please enter an itinerary name';

  @override
  String addPlaceToDayTitle(Object day) {
    return 'Add place · Day $day';
  }

  @override
  String placeAddedToDay(String placeName, Object day) {
    return 'Added \"$placeName\" to Day $day';
  }

  @override
  String get weekdayMon => 'Monday';

  @override
  String get weekdayTue => 'Tuesday';

  @override
  String get weekdayWed => 'Wednesday';

  @override
  String get weekdayThu => 'Thursday';

  @override
  String get weekdayFri => 'Friday';

  @override
  String get weekdaySat => 'Saturday';

  @override
  String get weekdaySun => 'Sunday';

  @override
  String get placeNotFound => 'Place not found.';

  @override
  String get vr360Badge => '360° VR';

  @override
  String reviewCountParen(Object count) {
    return '($count reviews)';
  }

  @override
  String get experienceVr360Button => 'Try the 360° experience';

  @override
  String get introductionHeading => 'About';

  @override
  String reviewsHeading(Object count) {
    return 'Reviews ($count)';
  }

  @override
  String get noReviewsForPlace => 'No reviews yet for this place.';

  @override
  String get visitDurationUnknown => 'Visit duration not specified';

  @override
  String visitDurationLabel(String duration) {
    return 'Visit duration: $duration';
  }

  @override
  String ticketPriceLabel(String price) {
    return 'Entry ticket: $price';
  }

  @override
  String openingHoursAllWeek(String hours) {
    return 'Opening hours: $hours (every day)';
  }

  @override
  String get openingHoursLabel => 'Opening hours:';

  @override
  String get pleaseSelectRating => 'Please select a star rating';

  @override
  String get reviewSubmittedPendingApproval => 'Review submitted — it will show publicly once approved.';

  @override
  String get writeReviewTitle => 'Write your review';

  @override
  String get editReviewTitle => 'Edit your review';

  @override
  String get reviewCommentHint => 'Share your experience...';

  @override
  String get submitReviewButton => 'Submit review';

  @override
  String get updateReviewButton => 'Update';

  @override
  String get reviewPendingNotice => 'Pending approval — only you can see this review';

  @override
  String savedPlacesLoadError(Object error) {
    return 'Failed to load saved places: $error';
  }

  @override
  String get noSavedPlacesTitle => 'No saved places yet';

  @override
  String get noSavedPlacesMessage => 'Tap the heart icon on a place\'s detail page to save it here.';

  @override
  String get unsaveTooltip => 'Remove from saved';

  @override
  String get saveTooltip => 'Save place';

  @override
  String get suggestedToursTitle => 'Suggested Tours';

  @override
  String toursLoadError(Object error) {
    return 'Failed to load tours: $error';
  }

  @override
  String get noToursYetTitle => 'No tours yet';

  @override
  String get noToursYetMessage => 'Suggested tours will be added by an administrator.';

  @override
  String get tourNotFound => 'Tour not found.';

  @override
  String get contactForPrice => 'Contact us';

  @override
  String reviewCountPlain(Object count) {
    return '$count reviews';
  }

  @override
  String placeCountLabel(Object count) {
    return '$count places';
  }

  @override
  String get placesInTourHeading => 'Places in this tour';

  @override
  String get addToMyItinerary => 'Add to my itinerary';

  @override
  String get noReviewsForTour => 'No reviews yet for this tour.';

  @override
  String reviewsLoadError(Object error) {
    return 'Failed to load reviews: $error';
  }

  @override
  String get vr360FallbackTitle => 'VR 360°';

  @override
  String get gyroMobileOnlyMessage => 'Sensor-based rotation is only supported on a real mobile device.';

  @override
  String get gyroOffTooltip => 'Turn off sensor rotation';

  @override
  String get gyroOnTooltip => 'Turn on sensor rotation';

  @override
  String media360LoadError(Object error) {
    return 'Failed to load 360° data: $error';
  }

  @override
  String get no360ForPlace => 'No 360° images for this place yet.';

  @override
  String get viewOtherHotspotTooltip => 'View another viewpoint';

  @override
  String get loading360Message => 'Loading 360° image...';

  @override
  String get rotateHint360 => 'Swipe or tilt your device to look around in 360°';

  @override
  String viewpointLabel(Object number) {
    return 'Viewpoint $number';
  }

  @override
  String get updateProfileFailedMessage => 'Update failed, please try again.';

  @override
  String profileLoadError(Object error) {
    return 'Failed to load profile: $error';
  }

  @override
  String get userInfoNotFound => 'User information not found.';

  @override
  String get defaultTravelerName => 'Traveler';

  @override
  String memberSince(String date) {
    return 'Member since $date';
  }

  @override
  String get phoneNumberLabel => 'Phone number';

  @override
  String get travelPreferencesHeading => 'Travel preferences';

  @override
  String get travelPreferencesSubtitle => 'Helps the AI assistant suggest places that suit you better.';

  @override
  String get save => 'Save';

  @override
  String get editProfileButton => 'Edit profile';

  @override
  String get logout => 'Log out';

  @override
  String get languageSectionTitle => 'Language';

  @override
  String get languageVietnamese => 'Tiếng Việt';

  @override
  String get languageEnglish => 'English';
}
