package com.track.infrastructure.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "wallets")
@Getter
@Setter
public class WalletsConfig {
    private String btcMainnet;
    private String ethErc20;
    private String ethBep20;
    private String usdtErc20;
    private String usdtTrc20;
    private String usdtBep20;
    private String solMainnet;
    private String tonMainnet;
}
