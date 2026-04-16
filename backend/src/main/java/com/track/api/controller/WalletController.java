package com.track.api.controller;

import com.track.infrastructure.config.WalletsConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wallets")
@RequiredArgsConstructor
public class WalletController {

    private final WalletsConfig walletsConfig;

    @GetMapping
    public ResponseEntity<Map<String, String>> getWallets() {
        Map<String, String> wallets = new LinkedHashMap<>();
        putIfNotBlank(wallets, "btcMainnet",  walletsConfig.getBtcMainnet());
        putIfNotBlank(wallets, "ethErc20",    walletsConfig.getEthErc20());
        putIfNotBlank(wallets, "ethBep20",    walletsConfig.getEthBep20());
        putIfNotBlank(wallets, "usdtErc20",   walletsConfig.getUsdtErc20());
        putIfNotBlank(wallets, "usdtTrc20",   walletsConfig.getUsdtTrc20());
        putIfNotBlank(wallets, "usdtBep20",   walletsConfig.getUsdtBep20());
        putIfNotBlank(wallets, "solMainnet",  walletsConfig.getSolMainnet());
        putIfNotBlank(wallets, "tonMainnet",  walletsConfig.getTonMainnet());
        return ResponseEntity.ok(wallets);
    }

    private void putIfNotBlank(Map<String, String> map, String key, String value) {
        if (value != null && !value.isBlank()) map.put(key, value);
    }
}
