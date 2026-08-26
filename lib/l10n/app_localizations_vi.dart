import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Vietnamese (`vi`).
class AppLocalizationsVi extends AppLocalizations {
  AppLocalizationsVi([String locale = 'vi']) : super(locale);

  @override
  String get appTitle => 'Trợ lý du lịch AI';

  @override
  String get navExplore => 'Khám phá';

  @override
  String get navTours => 'Tours';

  @override
  String get navItineraries => 'Lịch trình';

  @override
  String get navChat => 'Trợ lý';

  @override
  String get navSaved => 'Đã lưu';

  @override
  String get navProfile => 'Hồ sơ';

  @override
  String get login => 'Đăng nhập';

  @override
  String get register => 'Đăng ký';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailInvalidError => 'Vui lòng nhập email hợp lệ';

  @override
  String get passwordLabel => 'Mật khẩu';

  @override
  String get passwordTooShortError => 'Mật khẩu cần ít nhất 6 ký tự';

  @override
  String get forgotPasswordLink => 'Quên mật khẩu?';

  @override
  String get loginWithGoogle => 'Đăng nhập với Google';

  @override
  String get noAccountRegisterNow => 'Chưa có tài khoản? Đăng ký ngay';

  @override
  String get fullNameLabel => 'Họ tên';

  @override
  String get fullNameRequiredError => 'Vui lòng nhập họ tên';

  @override
  String get confirmPasswordLabel => 'Xác nhận mật khẩu';

  @override
  String get confirmPasswordMismatchError => 'Mật khẩu xác nhận không khớp';

  @override
  String get haveAccountLoginNow => 'Đã có tài khoản? Đăng nhập';

  @override
  String get forgotPasswordTitle => 'Quên mật khẩu';

  @override
  String get forgotPasswordInstructions => 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.';

  @override
  String get sendResetEmailButton => 'Gửi email khôi phục';

  @override
  String get resetEmailSentMessage => 'Đã gửi email khôi phục mật khẩu, vui lòng kiểm tra hộp thư.';

  @override
  String get authErrorInvalidEmail => 'Email không hợp lệ.';

  @override
  String get authErrorUserDisabled => 'Tài khoản này đã bị khoá.';

  @override
  String get authErrorUserNotFound => 'Không tìm thấy tài khoản với email này.';

  @override
  String get authErrorWrongPassword => 'Email hoặc mật khẩu không đúng.';

  @override
  String get authErrorEmailInUse => 'Email này đã được đăng ký.';

  @override
  String get authErrorWeakPassword => 'Mật khẩu quá yếu, cần ít nhất 6 ký tự.';

  @override
  String get authErrorOperationNotAllowed => 'Phương thức đăng nhập này chưa được bật.';

  @override
  String get authErrorTooManyRequests => 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau.';

  @override
  String get authErrorNetworkFailed => 'Lỗi kết nối mạng, vui lòng thử lại.';

  @override
  String authErrorGeneric(String code) {
    return 'Đã có lỗi xảy ra ($code), vui lòng thử lại.';
  }

  @override
  String chatLoadError(Object error) {
    return 'Lỗi tải hội thoại: $error';
  }

  @override
  String get chatFunctionErrorFallback => 'Đã có lỗi khi gọi trợ lý AI.';

  @override
  String chatGenericError(Object error) {
    return 'Đã có lỗi: $error';
  }

  @override
  String get chatInputHint => 'Hỏi về địa điểm, lịch trình...';

  @override
  String get chatWelcomeMessage => 'Hỏi mình về địa điểm, lên lịch trình hay mẹo du lịch nhé!';

  @override
  String dayLabel(Object number) {
    return 'Ngày $number';
  }

  @override
  String get createItineraryFromSuggestion => 'Tạo lịch trình từ gợi ý này';

  @override
  String get aiSuggestedItineraryName => 'Lịch trình gợi ý từ AI';

  @override
  String get itineraryNameLabel => 'Tên lịch trình';

  @override
  String get startDateLabel => 'Ngày bắt đầu';

  @override
  String get cancel => 'Huỷ';

  @override
  String get createItineraryButton => 'Tạo lịch trình';

  @override
  String createItineraryError(Object error) {
    return 'Không tạo được lịch trình: $error';
  }

  @override
  String get tagHistory => 'Lịch sử';

  @override
  String get tagCuisine => 'Ẩm thực';

  @override
  String get tagNature => 'Thiên nhiên';

  @override
  String get tagCulture => 'Văn hoá';

  @override
  String get tagBeach => 'Biển đảo';

  @override
  String get tagMountain => 'Núi rừng';

  @override
  String get filterAll => 'Tất cả';

  @override
  String get recommendedForYou => 'Đề xuất cho bạn';

  @override
  String placesLoadError(Object error) {
    return 'Lỗi tải địa điểm: $error';
  }

  @override
  String get noMatchingPlacesFound => 'Không tìm thấy địa điểm phù hợp';

  @override
  String get profileTitle => 'Hồ sơ cá nhân';

  @override
  String get searchPlacesHint => 'Tìm địa điểm...';

  @override
  String get discoverNewJourney => 'Khám phá hành trình mới';

  @override
  String get suggestedPlacesForYou => 'Những địa điểm được gợi ý riêng cho chuyến đi của bạn';

  @override
  String durationHours(String hours) {
    return '$hours giờ';
  }

  @override
  String durationMinutes(Object minutes) {
    return '$minutes phút';
  }

  @override
  String get free => 'Miễn phí';

  @override
  String get myItinerariesTitle => 'Lịch trình của tôi';

  @override
  String get noItinerariesYetTitle => 'Chưa có lịch trình nào';

  @override
  String get noItinerariesYetMessage => 'Bấm \"Tạo lịch trình\" để bắt đầu lên kế hoạch chuyến đi.';

  @override
  String dayCount(int count) {
    return '$count ngày';
  }

  @override
  String itineraryLoadError(Object error) {
    return 'Lỗi tải lịch trình: $error';
  }

  @override
  String get itineraryFallbackTitle => 'Lịch trình';

  @override
  String get itineraryNotFound => 'Không tìm thấy lịch trình.';

  @override
  String get addDayButton => 'Thêm ngày';

  @override
  String get addPlaceButton => 'Thêm địa điểm';

  @override
  String get emptyDayMessage => 'Chưa có địa điểm nào trong ngày này.\nBấm \"Thêm địa điểm\" bên dưới.';

  @override
  String get placeNoLongerExists => '(Địa điểm không còn tồn tại)';

  @override
  String get removeFromItineraryTooltip => 'Xoá khỏi lịch trình';

  @override
  String get createItineraryTitle => 'Tạo lịch trình mới';

  @override
  String get itineraryNameRequiredError => 'Vui lòng nhập tên lịch trình';

  @override
  String addPlaceToDayTitle(Object day) {
    return 'Thêm địa điểm · Ngày $day';
  }

  @override
  String placeAddedToDay(String placeName, Object day) {
    return 'Đã thêm \"$placeName\" vào Ngày $day';
  }

  @override
  String get weekdayMon => 'Thứ 2';

  @override
  String get weekdayTue => 'Thứ 3';

  @override
  String get weekdayWed => 'Thứ 4';

  @override
  String get weekdayThu => 'Thứ 5';

  @override
  String get weekdayFri => 'Thứ 6';

  @override
  String get weekdaySat => 'Thứ 7';

  @override
  String get weekdaySun => 'Chủ nhật';

  @override
  String get placeNotFound => 'Không tìm thấy địa điểm.';

  @override
  String get vr360Badge => '360° VR';

  @override
  String reviewCountParen(Object count) {
    return '($count đánh giá)';
  }

  @override
  String get experienceVr360Button => 'Trải nghiệm ngay 360°';

  @override
  String get introductionHeading => 'Giới thiệu';

  @override
  String reviewsHeading(Object count) {
    return 'Đánh giá ($count)';
  }

  @override
  String get noReviewsForPlace => 'Chưa có đánh giá nào cho địa điểm này.';

  @override
  String get visitDurationUnknown => 'Chưa rõ thời gian tham quan';

  @override
  String visitDurationLabel(String duration) {
    return 'Thời gian tham quan: $duration';
  }

  @override
  String ticketPriceLabel(String price) {
    return 'Vé vào cổng: $price';
  }

  @override
  String openingHoursAllWeek(String hours) {
    return 'Giờ mở cửa: $hours (cả tuần)';
  }

  @override
  String get openingHoursLabel => 'Giờ mở cửa:';

  @override
  String get pleaseSelectRating => 'Vui lòng chọn số sao đánh giá';

  @override
  String get reviewSubmittedPendingApproval => 'Đã gửi đánh giá, chờ duyệt trước khi hiển thị công khai.';

  @override
  String get writeReviewTitle => 'Viết đánh giá của bạn';

  @override
  String get editReviewTitle => 'Sửa đánh giá của bạn';

  @override
  String get reviewCommentHint => 'Chia sẻ trải nghiệm của bạn...';

  @override
  String get submitReviewButton => 'Gửi đánh giá';

  @override
  String get updateReviewButton => 'Cập nhật';

  @override
  String get reviewPendingNotice => 'Đang chờ duyệt — chỉ bạn thấy đánh giá này';

  @override
  String savedPlacesLoadError(Object error) {
    return 'Lỗi tải danh sách đã lưu: $error';
  }

  @override
  String get noSavedPlacesTitle => 'Chưa lưu địa điểm nào';

  @override
  String get noSavedPlacesMessage => 'Bấm biểu tượng trái tim ở màn Chi tiết địa điểm để lưu vào đây.';

  @override
  String get unsaveTooltip => 'Bỏ lưu';

  @override
  String get saveTooltip => 'Lưu địa điểm';

  @override
  String get suggestedToursTitle => 'Tour gợi ý';

  @override
  String toursLoadError(Object error) {
    return 'Lỗi tải tour: $error';
  }

  @override
  String get noToursYetTitle => 'Chưa có tour nào';

  @override
  String get noToursYetMessage => 'Tour gợi ý sẽ do quản trị viên thêm.';

  @override
  String get tourNotFound => 'Không tìm thấy tour.';

  @override
  String get contactForPrice => 'Liên hệ';

  @override
  String reviewCountPlain(Object count) {
    return '$count đánh giá';
  }

  @override
  String placeCountLabel(Object count) {
    return '$count địa điểm';
  }

  @override
  String get placesInTourHeading => 'Địa điểm trong tour';

  @override
  String get addToMyItinerary => 'Thêm vào lịch trình của tôi';

  @override
  String get noReviewsForTour => 'Chưa có đánh giá nào cho tour này.';

  @override
  String reviewsLoadError(Object error) {
    return 'Lỗi tải đánh giá: $error';
  }

  @override
  String get vr360FallbackTitle => 'VR 360°';

  @override
  String get gyroMobileOnlyMessage => 'Xoay theo cảm biến chỉ hỗ trợ trên thiết bị di động thật.';

  @override
  String get gyroOffTooltip => 'Tắt xoay theo cảm biến';

  @override
  String get gyroOnTooltip => 'Bật xoay theo cảm biến';

  @override
  String media360LoadError(Object error) {
    return 'Lỗi tải dữ liệu 360°: $error';
  }

  @override
  String get no360ForPlace => 'Chưa có ảnh 360° cho địa điểm này.';

  @override
  String get viewOtherHotspotTooltip => 'Xem điểm nhìn khác';

  @override
  String get loading360Message => 'Đang tải ảnh 360°...';

  @override
  String get rotateHint360 => 'Vuốt hoặc nghiêng thiết bị để xoay 360°';

  @override
  String viewpointLabel(Object number) {
    return 'Điểm nhìn $number';
  }

  @override
  String get updateProfileFailedMessage => 'Cập nhật thất bại, vui lòng thử lại.';

  @override
  String profileLoadError(Object error) {
    return 'Lỗi tải hồ sơ: $error';
  }

  @override
  String get userInfoNotFound => 'Không tìm thấy thông tin người dùng.';

  @override
  String get defaultTravelerName => 'Bạn du lịch';

  @override
  String memberSince(String date) {
    return 'Thành viên từ $date';
  }

  @override
  String get phoneNumberLabel => 'Số điện thoại';

  @override
  String get travelPreferencesHeading => 'Sở thích du lịch';

  @override
  String get travelPreferencesSubtitle => 'Giúp trợ lý AI gợi ý địa điểm sát với bạn hơn.';

  @override
  String get save => 'Lưu';

  @override
  String get editProfileButton => 'Sửa thông tin';

  @override
  String get logout => 'Đăng xuất';

  @override
  String get languageSectionTitle => 'Ngôn ngữ';

  @override
  String get languageVietnamese => 'Tiếng Việt';

  @override
  String get languageEnglish => 'English';
}
