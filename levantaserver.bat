@echo off
echo.
Color 0a
Title Server Busu
echo Iniciando server.
mode 5000,5000
if not exist node_modules echo Baixando pacotes&npm install
node index.js
