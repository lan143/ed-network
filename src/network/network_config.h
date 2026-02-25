#pragma once

#define WIFI_SSID_LEN 32 + 1
#define WIFI_PWD_LEN 64 + 1

namespace EDNetwork
{
    struct Config
    {
        bool isAPMode = true;
        char wifiAPSSID[WIFI_SSID_LEN] = {0};
        bool wifiAPHasPassword = false;
        char wifiAPPassword[WIFI_PWD_LEN] = {0};
        char wifiSSID[WIFI_SSID_LEN] = {0};
        char wifiPassword[WIFI_PWD_LEN] = {0};
    };
}
