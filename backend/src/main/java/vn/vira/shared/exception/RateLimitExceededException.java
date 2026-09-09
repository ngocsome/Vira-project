package vn.vira.shared.exception;

public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException() {
        super("Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.");
    }
}
