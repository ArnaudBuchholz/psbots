```mermaid
 graph TD
    subgraph StringUtils
      paddToTen("paddToTen()<br><i>(exported, 1 caller)</i>");
    end

    subgraph API
      subgraph OrderModule
        processOrder("processOrder()") --> validateOrder("validateOrder()<br><i>(internal, 1 caller)</i>");
      end
    
      subgraph ReportingModule
        generateReport("generateReport()") --> paddToTen;
        generateReport("generateReport()") --> processOrder;
      end
    end
```
