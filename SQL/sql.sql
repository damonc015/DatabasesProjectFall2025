DROP FUNCTION IF EXISTS GetCurrentStock;

CREATE FUNCTION GetCurrentStock(p_food_id INT)
RETURNS DECIMAL(9,2)
READS SQL DATA
BEGIN
  DECLARE current_qty DECIMAL(9,2);

  SET current_qty = (
    SELECT SUM(
      CASE
        WHEN TransactionType IN ('add','purchase','transfer_in') THEN QtyInBaseUnits
        WHEN TransactionType IN ('consume','expire','transfer_out') THEN -QtyInBaseUnits
        ELSE 0
      END
    )
    FROM InventoryTransaction
    WHERE FoodItemID = p_food_id
  );

  IF current_qty IS NULL THEN
    SET current_qty = 0;
  END IF;

  RETURN current_qty;
END;



DROP PROCEDURE IF EXISTS GetHouseholdInventory;
CREATE PROCEDURE GetHouseholdInventory(IN p_HouseholdID INT)
BEGIN
    SELECT 
        f.FoodItemID,
        f.Name AS FoodName,
        f.Type,
        f.Category,
        p.Label AS PackageLabel,
        p.BaseUnitAmt AS QtyPerPackage,
        GetCurrentStock(f.FoodItemID) AS TotalQtyInBaseUnits,
        bu.Abbreviation AS BaseUnitAbbr,
        FLOOR(GetCurrentStock(f.FoodItemID) / p.BaseUnitAmt) AS WholePackages,
        MOD(GetCurrentStock(f.FoodItemID), p.BaseUnitAmt) AS Remainder
    FROM FoodItem f
    JOIN Package p 
        ON f.PreferredPackageID = p.PackageID
    JOIN BaseUnit bu 
        ON f.BaseUnitID = bu.UnitID
    WHERE f.HouseholdID = p_HouseholdID
      AND GetCurrentStock(f.FoodItemID) > 0;
END;

DROP PROCEDURE IF EXISTS GetFoodQtyByLocation;
CREATE PROCEDURE GetFoodQtyByLocation(
    IN p_FoodItemID INT
)
BEGIN
    SELECT 
        f.Name AS Food,
        f.Type AS Type,
        p.Label AS PackageLabel, 
        l.LocationName as Location,
        SUM(
            CASE 
                WHEN i.TransactionType IN ('add', 'purchase', 'transfer_in') THEN i.QtyInBaseUnits
                WHEN i.TransactionType IN ('consume', 'expire', 'transfer_out') THEN -i.QtyInBaseUnits
                ELSE 0
            END
        ) AS CurrentQty,
        CONCAT(
            ROUND(
                SUM(
                    CASE 
                        WHEN i.TransactionType IN ('add', 'purchase', 'transfer_in') THEN i.QtyInBaseUnits
                        WHEN i.TransactionType IN ('consume', 'expire', 'transfer_out') THEN -i.QtyInBaseUnits
                        ELSE 0
                    END
                ) / p.BaseUnitAmt, 2
            ),
            ' ',
            p.Label
        ) AS EquivalentPackages
    FROM InventoryTransaction i
    JOIN FoodItem f ON i.FoodItemID = f.FoodItemID
    JOIN Package p ON f.PreferredPackageID = p.PackageID
    JOIN Location l ON l.locationID = i.locationID
    WHERE i.FoodItemID = p_FoodItemID
    GROUP BY i.LocationID, p.Label;
END;