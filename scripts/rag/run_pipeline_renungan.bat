@echo off
cd /d D:\paroki_digital_stclemens\scripts\rag
echo ============================================== >> D:\paroki_digital_stclemens\scripts\rag\pipeline_renungan.log
echo Run mulai: %DATE% %TIME% >> D:\paroki_digital_stclemens\scripts\rag\pipeline_renungan.log
echo ============================================== >> D:\paroki_digital_stclemens\scripts\rag\pipeline_renungan.log
C:\Python314\python.exe pipeline_renungan.py >> D:\paroki_digital_stclemens\scripts\rag\pipeline_renungan.log 2>&1
echo Run selesai: %DATE% %TIME% >> D:\paroki_digital_stclemens\scripts\rag\pipeline_renungan.log
echo. >> D:\paroki_digital_stclemens\scripts\rag\pipeline_renungan.log
