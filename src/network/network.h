#pragma once

#include <Arduino.h>
#include <ETH.H>
#include <list>

#include "network_config.h"

namespace EDNetwork
{
    enum Modes
    {
        MODE_ETHERNET,
        MODE_WIFI,
        MODE_WIFI_AP,
    };

    typedef std::function<void(bool isConnected)> ConnectFunction;

    class NetworkMgr
    {
    public:
        NetworkMgr() {}

        void init(
            Config config,
            bool hasEth = false,
            uint8_t phy_addr=ETH_PHY_ADDR, 
            int power=ETH_PHY_POWER,
            int mdc=ETH_PHY_MDC,
            int mdio=ETH_PHY_MDIO,
            eth_phy_type_t type=ETH_PHY_TYPE,
            eth_clock_mode_t clk_mode=ETH_CLK_MODE,
            bool use_mac_from_efuse=false
        );
        void loop();
        bool isConnected() { return _isWiFiConnected || _isEthernetConnected; }
        void OnConnect(ConnectFunction fn) { _connectCallbacks.push_back(std::move(fn)); }

    private:
        void runEthernet(
            uint8_t phy_addr, 
            int power,
            int mdc,
            int mdio,
            eth_phy_type_t type,
            eth_clock_mode_t clk_mode,
            bool use_mac_from_efuse
        );
        void runWifi();
        void runWifiAP();

    private:
        Config _config;
        bool _isWiFiConnected = false;
        bool _isEthernetConnected = false;
        bool _prevIsConnected = false;

        Modes _mode;
        uint64_t _lastCheckConnectTime;
        uint32_t _failedConnectCounts;
        std::list<ConnectFunction> _connectCallbacks;
    };

}
