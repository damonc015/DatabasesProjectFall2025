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
        WHEN TransactionType IN ('remove','expire','transfer_out') THEN -QtyInBaseUnits
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
CREATE PROCEDURE GetHouseholdInventory(IN p_HouseholdID INT, IN p_SearchQuery VARCHAR(255))
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
        MOD(GetCurrentStock(f.FoodItemID), p.BaseUnitAmt) AS Remainder,
        (SELECT i.LocationID 
         FROM InventoryTransaction i 
         WHERE i.FoodItemID = f.FoodItemID 
         ORDER BY i.CreatedAt DESC 
         LIMIT 1) AS LocationID
    FROM FoodItem f
    JOIN Package p 
        ON f.PreferredPackageID = p.PackageID
    JOIN BaseUnit bu 
        ON f.BaseUnitID = bu.UnitID
    WHERE f.HouseholdID = p_HouseholdID
      AND GetCurrentStock(f.FoodItemID) > 0
      AND (p_SearchQuery IS NULL OR p_SearchQuery = '' OR LOWER(f.Name) LIKE CONCAT('%', LOWER(p_SearchQuery), '%'))
    ORDER BY f.FoodItemID DESC;
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
                WHEN i.TransactionType IN ('remove', 'expire', 'transfer_out') THEN -i.QtyInBaseUnits
                ELSE 0
            END
        ) AS CurrentQty,
        CONCAT(
            ROUND(
                SUM(
                    CASE 
                        WHEN i.TransactionType IN ('add', 'purchase', 'transfer_in') THEN i.QtyInBaseUnits
                        WHEN i.TransactionType IN ('remove', 'expire', 'transfer_out') THEN -i.QtyInBaseUnits
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

DROP PROCEDURE IF EXISTS GetInventoryByLocation;
CREATE PROCEDURE GetInventoryByLocation(IN p_HouseholdID INT, IN p_LocationID INT, IN p_SearchQuery VARCHAR(255))
BEGIN
    SELECT 
        f.FoodItemID,
        f.Name AS FoodName,
        f.Type,
        f.Category,
        p.Label AS PackageLabel,
        p.BaseUnitAmt AS QtyPerPackage,
        SUM(
            CASE 
                WHEN i.TransactionType IN ('add', 'purchase', 'transfer_in') THEN i.QtyInBaseUnits
                WHEN i.TransactionType IN ('remove', 'expire', 'transfer_out') THEN -i.QtyInBaseUnits
                ELSE 0
            END
        ) AS TotalQtyInBaseUnits,
        bu.Abbreviation AS BaseUnitAbbr,
        FLOOR(
            SUM(
                CASE 
                    WHEN i.TransactionType IN ('add', 'purchase', 'transfer_in') THEN i.QtyInBaseUnits
                    WHEN i.TransactionType IN ('remove', 'expire', 'transfer_out') THEN -i.QtyInBaseUnits
                    ELSE 0
                END
            ) / p.BaseUnitAmt
        ) AS WholePackages,
        MOD(
            SUM(
                CASE 
                    WHEN i.TransactionType IN ('add', 'purchase', 'transfer_in') THEN i.QtyInBaseUnits
                    WHEN i.TransactionType IN ('remove', 'expire', 'transfer_out') THEN -i.QtyInBaseUnits
                    ELSE 0
                END
            ), 
            p.BaseUnitAmt
        ) AS Remainder,
        p_LocationID AS LocationID
    FROM FoodItem f
    JOIN Package p ON f.PreferredPackageID = p.PackageID
    JOIN BaseUnit bu ON f.BaseUnitID = bu.UnitID
    JOIN InventoryTransaction i ON f.FoodItemID = i.FoodItemID
    JOIN Location l ON i.LocationID = l.LocationID
    WHERE f.HouseholdID = p_HouseholdID
      AND l.LocationID = p_LocationID
      AND (p_SearchQuery IS NULL OR p_SearchQuery = '' OR LOWER(f.Name) LIKE CONCAT('%', LOWER(p_SearchQuery), '%'))
    GROUP BY f.FoodItemID, f.Name, f.Type, f.Category, p.Label, p.BaseUnitAmt, bu.Abbreviation
    HAVING TotalQtyInBaseUnits > 0
    ORDER BY f.FoodItemID DESC;
END;
DROP PROCEDURE IF EXISTS AddRemoveExistingFoodItem;
CREATE PROCEDURE AddRemoveExistingFoodItem(
    IN f_FoodItemID INT,
    IN l_LocationID INT,
    IN u_UserID INT,
    IN i_TransactionType VARCHAR(20),
    IN quantity DECIMAL(9,2),
    IN i_ExpirationDate DATE
)
BEGIN
    DECLARE pkg_id INT;
    DECLARE qty_in_base DECIMAL(9,2);
    DECLARE exp_date DATE;

    IF i_ExpirationDate IS NOT NULL THEN
        SET exp_date = i_ExpirationDate;
    ELSEIF i_TransactionType IN ('add','purchase','transfer_in') THEN
        SET exp_date = CURDATE() + INTERVAL 14 DAY;
    ELSE
        SET exp_date = NULL;
    END IF;

    INSERT INTO InventoryTransaction (
        FoodItemID, LocationID, UserID, QtyInBaseUnits, TransactionType, ExpirationDate
    )
    VALUES (
        f_FoodItemID, l_LocationID, u_UserID, quantity, i_TransactionType, exp_date
    );
END;

DROP PROCEDURE IF EXISTS AddNewFoodItem;
CREATE PROCEDURE AddNewFoodItem(
    IN f_food_name VARCHAR(100),
    IN f_type VARCHAR(100),
    IN f_category VARCHAR(100),
    IN f_base_unit_id INT,
    IN h_household_id INT,
    IN p_label VARCHAR(100),
    IN p_base_unit_amt DECIMAL(9,2),
    IN l_location_id INT,
    IN s_target_level DECIMAL(9,2),
    IN quantity INT,
    IN u_user_id INT,
    IN expiration_date DATE,
    IN p_price_per_item DECIMAL(10,2),
    IN p_store VARCHAR(100)
)
BEGIN
    DECLARE food_item_id INT;
    DECLARE package_id INT;
    DECLARE total_base_qty DECIMAL(9,2);

    INSERT INTO FoodItem (BaseUnitId, HouseholdID, Name, Type, Category, PreferredPackageID, IsArchived)
    VALUES (f_base_unit_id, h_household_id, f_food_name, f_type, f_category, NULL, FALSE);

    SET food_item_id = (SELECT FoodItemId
                        FROM FoodItem
                        WHERE Name = f_food_name
                        AND HouseholdID = h_household_id
                        ORDER BY FoodItemId DESC
                        LIMIT 1);

    INSERT INTO Package (FoodItemID, Label, BaseUnitAmt)
    VALUES (food_item_id, p_label, p_base_unit_amt);

    SET package_id = (SELECT PackageID
                      FROM Package
                      WHERE FoodItemID = food_item_id
                      AND Label = p_label
                      AND BaseUnitAmt = p_base_unit_amt
                      ORDER BY PackageID DESC
                      LIMIT 1);

    UPDATE FoodItem
    SET PreferredPackageID = package_id
    WHERE FoodItemId = food_item_id;

    IF EXISTS (
        SELECT 1 FROM StockLevel
        WHERE FoodItemId = food_item_id
    ) THEN
        UPDATE StockLevel
        SET TargetLevel = s_target_level
        WHERE FoodItemId = food_item_id;
    ELSE 
        INSERT INTO StockLevel(FoodItemId, TargetLevel)
        VALUES (food_item_id, s_target_level);
    END IF;

    /* Calculation: total_base_qty = package_base_unit_amt × quantity */
    SET total_base_qty = p_base_unit_amt * quantity;

    IF p_price_per_item IS NOT NULL THEN
        INSERT INTO PriceLog (PackageID, PriceTotal, Store)
        VALUES (package_id, p_price_per_item, p_store);
    END IF;

    INSERT INTO InventoryTransaction(FoodItemID,
                                     LocationID,
                                     UserID,
                                     QtyInBaseUnits,
                                     TransactionType,
                                     ExpirationDate)
    VALUES (food_item_id, l_location_id, u_user_id, total_base_qty, 'add', expiration_date);
END;

ALTER TABLE FoodItem
ADD UNIQUE (HouseholdID, Name);
