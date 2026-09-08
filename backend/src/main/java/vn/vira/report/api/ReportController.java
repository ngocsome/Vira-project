package vn.vira.report.api;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.vira.report.application.ReportService;
import vn.vira.shared.api.ApiResponse;

@RestController
@RequestMapping("/projects/{projectId}/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/overview")
    public ApiResponse<ProjectOverviewResponse> overview(@PathVariable Long projectId) {
        return ApiResponse.ok(
                reportService.overview(projectId),
                "Lấy báo cáo tổng quan thành công"
        );
    }
}
