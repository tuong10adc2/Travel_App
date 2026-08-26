import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_vi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale) : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates = <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('vi')
  ];

  /// No description provided for @appTitle.
  ///
  /// In vi, this message translates to:
  /// **'Trợ lý du lịch AI'**
  String get appTitle;

  /// No description provided for @navExplore.
  ///
  /// In vi, this message translates to:
  /// **'Khám phá'**
  String get navExplore;

  /// No description provided for @navTours.
  ///
  /// In vi, this message translates to:
  /// **'Tours'**
  String get navTours;

  /// No description provided for @navItineraries.
  ///
  /// In vi, this message translates to:
  /// **'Lịch trình'**
  String get navItineraries;

  /// No description provided for @navChat.
  ///
  /// In vi, this message translates to:
  /// **'Trợ lý'**
  String get navChat;

  /// No description provided for @navSaved.
  ///
  /// In vi, this message translates to:
  /// **'Đã lưu'**
  String get navSaved;

  /// No description provided for @navProfile.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ'**
  String get navProfile;

  /// No description provided for @login.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get login;

  /// No description provided for @register.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký'**
  String get register;

  /// No description provided for @emailLabel.
  ///
  /// In vi, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @emailInvalidError.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập email hợp lệ'**
  String get emailInvalidError;

  /// No description provided for @passwordLabel.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu'**
  String get passwordLabel;

  /// No description provided for @passwordTooShortError.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu cần ít nhất 6 ký tự'**
  String get passwordTooShortError;

  /// No description provided for @forgotPasswordLink.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu?'**
  String get forgotPasswordLink;

  /// No description provided for @loginWithGoogle.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập với Google'**
  String get loginWithGoogle;

  /// No description provided for @noAccountRegisterNow.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có tài khoản? Đăng ký ngay'**
  String get noAccountRegisterNow;

  /// No description provided for @fullNameLabel.
  ///
  /// In vi, this message translates to:
  /// **'Họ tên'**
  String get fullNameLabel;

  /// No description provided for @fullNameRequiredError.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập họ tên'**
  String get fullNameRequiredError;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận mật khẩu'**
  String get confirmPasswordLabel;

  /// No description provided for @confirmPasswordMismatchError.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu xác nhận không khớp'**
  String get confirmPasswordMismatchError;

  /// No description provided for @haveAccountLoginNow.
  ///
  /// In vi, this message translates to:
  /// **'Đã có tài khoản? Đăng nhập'**
  String get haveAccountLoginNow;

  /// No description provided for @forgotPasswordTitle.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu'**
  String get forgotPasswordTitle;

  /// No description provided for @forgotPasswordInstructions.
  ///
  /// In vi, this message translates to:
  /// **'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.'**
  String get forgotPasswordInstructions;

  /// No description provided for @sendResetEmailButton.
  ///
  /// In vi, this message translates to:
  /// **'Gửi email khôi phục'**
  String get sendResetEmailButton;

  /// No description provided for @resetEmailSentMessage.
  ///
  /// In vi, this message translates to:
  /// **'Đã gửi email khôi phục mật khẩu, vui lòng kiểm tra hộp thư.'**
  String get resetEmailSentMessage;

  /// No description provided for @authErrorInvalidEmail.
  ///
  /// In vi, this message translates to:
  /// **'Email không hợp lệ.'**
  String get authErrorInvalidEmail;

  /// No description provided for @authErrorUserDisabled.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản này đã bị khoá.'**
  String get authErrorUserDisabled;

  /// No description provided for @authErrorUserNotFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy tài khoản với email này.'**
  String get authErrorUserNotFound;

  /// No description provided for @authErrorWrongPassword.
  ///
  /// In vi, this message translates to:
  /// **'Email hoặc mật khẩu không đúng.'**
  String get authErrorWrongPassword;

  /// No description provided for @authErrorEmailInUse.
  ///
  /// In vi, this message translates to:
  /// **'Email này đã được đăng ký.'**
  String get authErrorEmailInUse;

  /// No description provided for @authErrorWeakPassword.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu quá yếu, cần ít nhất 6 ký tự.'**
  String get authErrorWeakPassword;

  /// No description provided for @authErrorOperationNotAllowed.
  ///
  /// In vi, this message translates to:
  /// **'Phương thức đăng nhập này chưa được bật.'**
  String get authErrorOperationNotAllowed;

  /// No description provided for @authErrorTooManyRequests.
  ///
  /// In vi, this message translates to:
  /// **'Bạn thao tác quá nhiều lần, vui lòng thử lại sau.'**
  String get authErrorTooManyRequests;

  /// No description provided for @authErrorNetworkFailed.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi kết nối mạng, vui lòng thử lại.'**
  String get authErrorNetworkFailed;

  /// No description provided for @authErrorGeneric.
  ///
  /// In vi, this message translates to:
  /// **'Đã có lỗi xảy ra ({code}), vui lòng thử lại.'**
  String authErrorGeneric(String code);

  /// No description provided for @chatLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải hội thoại: {error}'**
  String chatLoadError(Object error);

  /// No description provided for @chatFunctionErrorFallback.
  ///
  /// In vi, this message translates to:
  /// **'Đã có lỗi khi gọi trợ lý AI.'**
  String get chatFunctionErrorFallback;

  /// No description provided for @chatGenericError.
  ///
  /// In vi, this message translates to:
  /// **'Đã có lỗi: {error}'**
  String chatGenericError(Object error);

  /// No description provided for @chatInputHint.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi về địa điểm, lịch trình...'**
  String get chatInputHint;

  /// No description provided for @chatWelcomeMessage.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi mình về địa điểm, lên lịch trình hay mẹo du lịch nhé!'**
  String get chatWelcomeMessage;

  /// No description provided for @dayLabel.
  ///
  /// In vi, this message translates to:
  /// **'Ngày {number}'**
  String dayLabel(Object number);

  /// No description provided for @createItineraryFromSuggestion.
  ///
  /// In vi, this message translates to:
  /// **'Tạo lịch trình từ gợi ý này'**
  String get createItineraryFromSuggestion;

  /// No description provided for @aiSuggestedItineraryName.
  ///
  /// In vi, this message translates to:
  /// **'Lịch trình gợi ý từ AI'**
  String get aiSuggestedItineraryName;

  /// No description provided for @itineraryNameLabel.
  ///
  /// In vi, this message translates to:
  /// **'Tên lịch trình'**
  String get itineraryNameLabel;

  /// No description provided for @startDateLabel.
  ///
  /// In vi, this message translates to:
  /// **'Ngày bắt đầu'**
  String get startDateLabel;

  /// No description provided for @cancel.
  ///
  /// In vi, this message translates to:
  /// **'Huỷ'**
  String get cancel;

  /// No description provided for @createItineraryButton.
  ///
  /// In vi, this message translates to:
  /// **'Tạo lịch trình'**
  String get createItineraryButton;

  /// No description provided for @createItineraryError.
  ///
  /// In vi, this message translates to:
  /// **'Không tạo được lịch trình: {error}'**
  String createItineraryError(Object error);

  /// No description provided for @tagHistory.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử'**
  String get tagHistory;

  /// No description provided for @tagCuisine.
  ///
  /// In vi, this message translates to:
  /// **'Ẩm thực'**
  String get tagCuisine;

  /// No description provided for @tagNature.
  ///
  /// In vi, this message translates to:
  /// **'Thiên nhiên'**
  String get tagNature;

  /// No description provided for @tagCulture.
  ///
  /// In vi, this message translates to:
  /// **'Văn hoá'**
  String get tagCulture;

  /// No description provided for @tagBeach.
  ///
  /// In vi, this message translates to:
  /// **'Biển đảo'**
  String get tagBeach;

  /// No description provided for @tagMountain.
  ///
  /// In vi, this message translates to:
  /// **'Núi rừng'**
  String get tagMountain;

  /// No description provided for @filterAll.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get filterAll;

  /// No description provided for @recommendedForYou.
  ///
  /// In vi, this message translates to:
  /// **'Đề xuất cho bạn'**
  String get recommendedForYou;

  /// No description provided for @placesLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải địa điểm: {error}'**
  String placesLoadError(Object error);

  /// No description provided for @noMatchingPlacesFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy địa điểm phù hợp'**
  String get noMatchingPlacesFound;

  /// No description provided for @profileTitle.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ cá nhân'**
  String get profileTitle;

  /// No description provided for @searchPlacesHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm địa điểm...'**
  String get searchPlacesHint;

  /// No description provided for @discoverNewJourney.
  ///
  /// In vi, this message translates to:
  /// **'Khám phá hành trình mới'**
  String get discoverNewJourney;

  /// No description provided for @suggestedPlacesForYou.
  ///
  /// In vi, this message translates to:
  /// **'Những địa điểm được gợi ý riêng cho chuyến đi của bạn'**
  String get suggestedPlacesForYou;

  /// No description provided for @durationHours.
  ///
  /// In vi, this message translates to:
  /// **'{hours} giờ'**
  String durationHours(String hours);

  /// No description provided for @durationMinutes.
  ///
  /// In vi, this message translates to:
  /// **'{minutes} phút'**
  String durationMinutes(Object minutes);

  /// No description provided for @free.
  ///
  /// In vi, this message translates to:
  /// **'Miễn phí'**
  String get free;

  /// No description provided for @myItinerariesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch trình của tôi'**
  String get myItinerariesTitle;

  /// No description provided for @noItinerariesYetTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có lịch trình nào'**
  String get noItinerariesYetTitle;

  /// No description provided for @noItinerariesYetMessage.
  ///
  /// In vi, this message translates to:
  /// **'Bấm \"Tạo lịch trình\" để bắt đầu lên kế hoạch chuyến đi.'**
  String get noItinerariesYetMessage;

  /// No description provided for @dayCount.
  ///
  /// In vi, this message translates to:
  /// **'{count} ngày'**
  String dayCount(int count);

  /// No description provided for @itineraryLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải lịch trình: {error}'**
  String itineraryLoadError(Object error);

  /// No description provided for @itineraryFallbackTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch trình'**
  String get itineraryFallbackTitle;

  /// No description provided for @itineraryNotFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy lịch trình.'**
  String get itineraryNotFound;

  /// No description provided for @addDayButton.
  ///
  /// In vi, this message translates to:
  /// **'Thêm ngày'**
  String get addDayButton;

  /// No description provided for @addPlaceButton.
  ///
  /// In vi, this message translates to:
  /// **'Thêm địa điểm'**
  String get addPlaceButton;

  /// No description provided for @emptyDayMessage.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có địa điểm nào trong ngày này.\nBấm \"Thêm địa điểm\" bên dưới.'**
  String get emptyDayMessage;

  /// No description provided for @placeNoLongerExists.
  ///
  /// In vi, this message translates to:
  /// **'(Địa điểm không còn tồn tại)'**
  String get placeNoLongerExists;

  /// No description provided for @removeFromItineraryTooltip.
  ///
  /// In vi, this message translates to:
  /// **'Xoá khỏi lịch trình'**
  String get removeFromItineraryTooltip;

  /// No description provided for @createItineraryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tạo lịch trình mới'**
  String get createItineraryTitle;

  /// No description provided for @itineraryNameRequiredError.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập tên lịch trình'**
  String get itineraryNameRequiredError;

  /// No description provided for @addPlaceToDayTitle.
  ///
  /// In vi, this message translates to:
  /// **'Thêm địa điểm · Ngày {day}'**
  String addPlaceToDayTitle(Object day);

  /// No description provided for @placeAddedToDay.
  ///
  /// In vi, this message translates to:
  /// **'Đã thêm \"{placeName}\" vào Ngày {day}'**
  String placeAddedToDay(String placeName, Object day);

  /// No description provided for @weekdayMon.
  ///
  /// In vi, this message translates to:
  /// **'Thứ 2'**
  String get weekdayMon;

  /// No description provided for @weekdayTue.
  ///
  /// In vi, this message translates to:
  /// **'Thứ 3'**
  String get weekdayTue;

  /// No description provided for @weekdayWed.
  ///
  /// In vi, this message translates to:
  /// **'Thứ 4'**
  String get weekdayWed;

  /// No description provided for @weekdayThu.
  ///
  /// In vi, this message translates to:
  /// **'Thứ 5'**
  String get weekdayThu;

  /// No description provided for @weekdayFri.
  ///
  /// In vi, this message translates to:
  /// **'Thứ 6'**
  String get weekdayFri;

  /// No description provided for @weekdaySat.
  ///
  /// In vi, this message translates to:
  /// **'Thứ 7'**
  String get weekdaySat;

  /// No description provided for @weekdaySun.
  ///
  /// In vi, this message translates to:
  /// **'Chủ nhật'**
  String get weekdaySun;

  /// No description provided for @placeNotFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy địa điểm.'**
  String get placeNotFound;

  /// No description provided for @vr360Badge.
  ///
  /// In vi, this message translates to:
  /// **'360° VR'**
  String get vr360Badge;

  /// No description provided for @reviewCountParen.
  ///
  /// In vi, this message translates to:
  /// **'({count} đánh giá)'**
  String reviewCountParen(Object count);

  /// No description provided for @experienceVr360Button.
  ///
  /// In vi, this message translates to:
  /// **'Trải nghiệm ngay 360°'**
  String get experienceVr360Button;

  /// No description provided for @introductionHeading.
  ///
  /// In vi, this message translates to:
  /// **'Giới thiệu'**
  String get introductionHeading;

  /// No description provided for @reviewsHeading.
  ///
  /// In vi, this message translates to:
  /// **'Đánh giá ({count})'**
  String reviewsHeading(Object count);

  /// No description provided for @noReviewsForPlace.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có đánh giá nào cho địa điểm này.'**
  String get noReviewsForPlace;

  /// No description provided for @visitDurationUnknown.
  ///
  /// In vi, this message translates to:
  /// **'Chưa rõ thời gian tham quan'**
  String get visitDurationUnknown;

  /// No description provided for @visitDurationLabel.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian tham quan: {duration}'**
  String visitDurationLabel(String duration);

  /// No description provided for @ticketPriceLabel.
  ///
  /// In vi, this message translates to:
  /// **'Vé vào cổng: {price}'**
  String ticketPriceLabel(String price);

  /// No description provided for @openingHoursAllWeek.
  ///
  /// In vi, this message translates to:
  /// **'Giờ mở cửa: {hours} (cả tuần)'**
  String openingHoursAllWeek(String hours);

  /// No description provided for @openingHoursLabel.
  ///
  /// In vi, this message translates to:
  /// **'Giờ mở cửa:'**
  String get openingHoursLabel;

  /// No description provided for @pleaseSelectRating.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn số sao đánh giá'**
  String get pleaseSelectRating;

  /// No description provided for @reviewSubmittedPendingApproval.
  ///
  /// In vi, this message translates to:
  /// **'Đã gửi đánh giá, chờ duyệt trước khi hiển thị công khai.'**
  String get reviewSubmittedPendingApproval;

  /// No description provided for @writeReviewTitle.
  ///
  /// In vi, this message translates to:
  /// **'Viết đánh giá của bạn'**
  String get writeReviewTitle;

  /// No description provided for @editReviewTitle.
  ///
  /// In vi, this message translates to:
  /// **'Sửa đánh giá của bạn'**
  String get editReviewTitle;

  /// No description provided for @reviewCommentHint.
  ///
  /// In vi, this message translates to:
  /// **'Chia sẻ trải nghiệm của bạn...'**
  String get reviewCommentHint;

  /// No description provided for @submitReviewButton.
  ///
  /// In vi, this message translates to:
  /// **'Gửi đánh giá'**
  String get submitReviewButton;

  /// No description provided for @updateReviewButton.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật'**
  String get updateReviewButton;

  /// No description provided for @reviewPendingNotice.
  ///
  /// In vi, this message translates to:
  /// **'Đang chờ duyệt — chỉ bạn thấy đánh giá này'**
  String get reviewPendingNotice;

  /// No description provided for @savedPlacesLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải danh sách đã lưu: {error}'**
  String savedPlacesLoadError(Object error);

  /// No description provided for @noSavedPlacesTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chưa lưu địa điểm nào'**
  String get noSavedPlacesTitle;

  /// No description provided for @noSavedPlacesMessage.
  ///
  /// In vi, this message translates to:
  /// **'Bấm biểu tượng trái tim ở màn Chi tiết địa điểm để lưu vào đây.'**
  String get noSavedPlacesMessage;

  /// No description provided for @unsaveTooltip.
  ///
  /// In vi, this message translates to:
  /// **'Bỏ lưu'**
  String get unsaveTooltip;

  /// No description provided for @saveTooltip.
  ///
  /// In vi, this message translates to:
  /// **'Lưu địa điểm'**
  String get saveTooltip;

  /// No description provided for @suggestedToursTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tour gợi ý'**
  String get suggestedToursTitle;

  /// No description provided for @toursLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải tour: {error}'**
  String toursLoadError(Object error);

  /// No description provided for @noToursYetTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có tour nào'**
  String get noToursYetTitle;

  /// No description provided for @noToursYetMessage.
  ///
  /// In vi, this message translates to:
  /// **'Tour gợi ý sẽ do quản trị viên thêm.'**
  String get noToursYetMessage;

  /// No description provided for @tourNotFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy tour.'**
  String get tourNotFound;

  /// No description provided for @contactForPrice.
  ///
  /// In vi, this message translates to:
  /// **'Liên hệ'**
  String get contactForPrice;

  /// No description provided for @reviewCountPlain.
  ///
  /// In vi, this message translates to:
  /// **'{count} đánh giá'**
  String reviewCountPlain(Object count);

  /// No description provided for @placeCountLabel.
  ///
  /// In vi, this message translates to:
  /// **'{count} địa điểm'**
  String placeCountLabel(Object count);

  /// No description provided for @placesInTourHeading.
  ///
  /// In vi, this message translates to:
  /// **'Địa điểm trong tour'**
  String get placesInTourHeading;

  /// No description provided for @addToMyItinerary.
  ///
  /// In vi, this message translates to:
  /// **'Thêm vào lịch trình của tôi'**
  String get addToMyItinerary;

  /// No description provided for @noReviewsForTour.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có đánh giá nào cho tour này.'**
  String get noReviewsForTour;

  /// No description provided for @reviewsLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải đánh giá: {error}'**
  String reviewsLoadError(Object error);

  /// No description provided for @vr360FallbackTitle.
  ///
  /// In vi, this message translates to:
  /// **'VR 360°'**
  String get vr360FallbackTitle;

  /// No description provided for @gyroMobileOnlyMessage.
  ///
  /// In vi, this message translates to:
  /// **'Xoay theo cảm biến chỉ hỗ trợ trên thiết bị di động thật.'**
  String get gyroMobileOnlyMessage;

  /// No description provided for @gyroOffTooltip.
  ///
  /// In vi, this message translates to:
  /// **'Tắt xoay theo cảm biến'**
  String get gyroOffTooltip;

  /// No description provided for @gyroOnTooltip.
  ///
  /// In vi, this message translates to:
  /// **'Bật xoay theo cảm biến'**
  String get gyroOnTooltip;

  /// No description provided for @media360LoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải dữ liệu 360°: {error}'**
  String media360LoadError(Object error);

  /// No description provided for @no360ForPlace.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có ảnh 360° cho địa điểm này.'**
  String get no360ForPlace;

  /// No description provided for @viewOtherHotspotTooltip.
  ///
  /// In vi, this message translates to:
  /// **'Xem điểm nhìn khác'**
  String get viewOtherHotspotTooltip;

  /// No description provided for @loading360Message.
  ///
  /// In vi, this message translates to:
  /// **'Đang tải ảnh 360°...'**
  String get loading360Message;

  /// No description provided for @rotateHint360.
  ///
  /// In vi, this message translates to:
  /// **'Vuốt hoặc nghiêng thiết bị để xoay 360°'**
  String get rotateHint360;

  /// No description provided for @viewpointLabel.
  ///
  /// In vi, this message translates to:
  /// **'Điểm nhìn {number}'**
  String viewpointLabel(Object number);

  /// No description provided for @updateProfileFailedMessage.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật thất bại, vui lòng thử lại.'**
  String get updateProfileFailedMessage;

  /// No description provided for @profileLoadError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi tải hồ sơ: {error}'**
  String profileLoadError(Object error);

  /// No description provided for @userInfoNotFound.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy thông tin người dùng.'**
  String get userInfoNotFound;

  /// No description provided for @defaultTravelerName.
  ///
  /// In vi, this message translates to:
  /// **'Bạn du lịch'**
  String get defaultTravelerName;

  /// No description provided for @memberSince.
  ///
  /// In vi, this message translates to:
  /// **'Thành viên từ {date}'**
  String memberSince(String date);

  /// No description provided for @phoneNumberLabel.
  ///
  /// In vi, this message translates to:
  /// **'Số điện thoại'**
  String get phoneNumberLabel;

  /// No description provided for @travelPreferencesHeading.
  ///
  /// In vi, this message translates to:
  /// **'Sở thích du lịch'**
  String get travelPreferencesHeading;

  /// No description provided for @travelPreferencesSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Giúp trợ lý AI gợi ý địa điểm sát với bạn hơn.'**
  String get travelPreferencesSubtitle;

  /// No description provided for @save.
  ///
  /// In vi, this message translates to:
  /// **'Lưu'**
  String get save;

  /// No description provided for @editProfileButton.
  ///
  /// In vi, this message translates to:
  /// **'Sửa thông tin'**
  String get editProfileButton;

  /// No description provided for @logout.
  ///
  /// In vi, this message translates to:
  /// **'Đăng xuất'**
  String get logout;

  /// No description provided for @languageSectionTitle.
  ///
  /// In vi, this message translates to:
  /// **'Ngôn ngữ'**
  String get languageSectionTitle;

  /// No description provided for @languageVietnamese.
  ///
  /// In vi, this message translates to:
  /// **'Tiếng Việt'**
  String get languageVietnamese;

  /// No description provided for @languageEnglish.
  ///
  /// In vi, this message translates to:
  /// **'English'**
  String get languageEnglish;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>['en', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {


  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en': return AppLocalizationsEn();
    case 'vi': return AppLocalizationsVi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.'
  );
}
