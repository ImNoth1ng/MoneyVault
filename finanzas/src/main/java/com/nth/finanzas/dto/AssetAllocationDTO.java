package com.nth.finanzas.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssetAllocationDTO {

    private String name;
    private String symbol;
    private String type; // STOCK, ETF, CASH, etc.
    private BigDecimal valueMxn;
    private BigDecimal percentage;
    private String color;
}
