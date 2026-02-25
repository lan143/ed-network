#include <ETH.h>
#include <WiFi.h>
#include <esp_log.h>

#include "network.h"

void EDNetwork::NetworkMgr::init(
    EDNetwork::Config* config,
    bool hasEth = false,
    uint8_t phy_addr=ETH_PHY_ADDR, 
    int power=ETH_PHY_POWER,
    int mdc=ETH_PHY_MDC,
    int mdio=ETH_PHY_MDIO,
    eth_phy_type_t type=ETH_PHY_TYPE,
    eth_clock_mode_t clk_mode=ETH_CLK_MODE,
    bool use_mac_from_efuse=false
) {
    ESP_LOGI("network", "init start");
    _config = config;

    WiFi.onEvent([this](arduino_event_id_t event, arduino_event_info_t info) {
        switch (event) {
            case ARDUINO_EVENT_WIFI_STA_GOT_IP:
                _isWiFiConnected = true;
                ESP_LOGI("network", "wifi connected");
                break;
            case ARDUINO_EVENT_WIFI_STA_DISCONNECTED:
                _isWiFiConnected = false;
                ESP_LOGI("network", "wifi disconnected");
                break;
            case ARDUINO_EVENT_ETH_GOT_IP:
                _isEthernetConnected = true;
                ESP_LOGI("network", "ethernet connected");
                break;
            case ARDUINO_EVENT_ETH_DISCONNECTED:
                _isEthernetConnected = false;
                ESP_LOGI("network", "ethernet disconnected");
                break;
        }
    });

    if (hasEth) {
        runEthernet(phy_addr, power, mdc, mdio, type, clk_mode, use_mac_from_efuse);
    } else if (!_config->isAPMode) {
        runWifi();
    } else {
        runWifiAP();
    }

    ESP_LOGI("network", "init complete");
}

void EDNetwork::NetworkMgr::loop()
{
    if (_lastCheckConnectTime + 500000 < esp_timer_get_time()) {
        if (_prevIsConnected != isConnected()) {
            for (const auto& fn : _connectCallbacks) {
                fn(isConnected());
            }

            _prevIsConnected = isConnected();
        }

        if (_mode != EDNetwork::MODE_WIFI_AP) {
            if (!isConnected()) {
                _failedConnectCounts++;
            } else {
                _failedConnectCounts = 0;
            }

            if (_failedConnectCounts >= 30) {
                switch (_mode) {
                    case EDNetwork::MODE_ETHERNET:
                        if (!_config->isAPMode) {
                            runWifi();
                        } else {
                            runWifiAP();
                        }
                        break;
                    case EDNetwork::MODE_WIFI:
                        runWifiAP();
                }

                _failedConnectCounts = 0;
            }
        }

        _lastCheckConnectTime = esp_timer_get_time();
    }
}

void EDNetwork::NetworkMgr::runEthernet(
    uint8_t phy_addr, 
    int power,
    int mdc,
    int mdio,
    eth_phy_type_t type,
    eth_clock_mode_t clk_mode,
    bool use_mac_from_efuse
) {
    ESP_LOGI("network", "run in ethernet mode");

    ETH.begin(ETH_ADDR, -1, ETH_MDC_PIN, ETH_MDIO_PIN, ETH_TYPE, ETH_CLK_MODE);
    _mode = EDNetwork::MODE_ETHERNET;
}

void EDNetwork::NetworkMgr::runWifi()
{
    ESP_LOGI("network", "run in wifi client mode");

    WiFi.mode(WIFI_STA);
    WiFi.begin(_config->wifiSSID, _config->wifiPassword);
    _mode = EDNetwork::MODE_WIFI;
}

void EDNetwork::NetworkMgr::runWifiAP()
{
    ESP_LOGI("wifi", "run in wifi access point mode");

    WiFi.mode(WIFI_AP);
    WiFi.softAP(_config->wifiAPSSID, _config->wifiAPHasPassword ? _config->wifiAPPassword : NULL);
    _mode = EDNetwork::MODE_WIFI_AP;
}
