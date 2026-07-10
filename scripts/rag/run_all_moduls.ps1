$moduls = @(
    "modul_0_rev","modul_1_1_rev","modul_1_2_rev","modul_1_3_rev","modul_1_4_rev","modul_1_5_rev",
    "modul_2_1a_rev","modul_2_1b_rev","modul_2_2_rev","modul_2_3_rev","modul_2_4_rev","modul_2_5_rev","modul_2_6_rev",
    "modul_3_1_rev","modul_3_2a_rev","modul_3_2b_rev","modul_3_3_rev","modul_3_4a_rev","modul_3_4b_rev","modul_3_5_rev","modul_3_6_rev"
)

foreach ($m in $moduls) {
    Write-Host "=== Uploading $m ===" -ForegroundColor Cyan
    python "D:\paroki_digital_stclemens\scripts\rag\upload_modul.py" $m
    Write-Host "=== Done $m, cooling down 5s ===" -ForegroundColor Green
    Start-Sleep -Seconds 5
}

Write-Host "ALL MODULES PROCESSED" -ForegroundColor Yellow
