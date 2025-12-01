CREATE DATABASE IF NOT EXISTS stocker;
USE stocker;
CREATE TABLE Household (
    HouseholdID INT AUTO_INCREMENT PRIMARY KEY,
    HouseholdName VARCHAR(100) NOT NULL,
    JoinCode VARCHAR(10) NOT NULL UNIQUE
);

CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    HouseholdID INT,
    UserName VARCHAR(100) NOT NULL,
    DisplayName VARCHAR(100) NOT NULL,
    RoleName VARCHAR(20),
    PasswordHash VARCHAR(255),
    IsArchived BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (HouseholdID) REFERENCES Household(HouseholdID) 
);

CREATE TABLE Location (
    LocationID INT AUTO_INCREMENT PRIMARY KEY,
    HouseholdID INT NOT NULL,
    LocationName VARCHAR(100) NOT NULL,
    IsArchived BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (HouseholdID) REFERENCES Household(HouseholdID)
);

CREATE TABLE BaseUnit (
    UnitID INT AUTO_INCREMENT PRIMARY KEY,
    MeasurementType VARCHAR(50),
    Abbreviation VARCHAR(10)
);

CREATE TABLE FoodItem (
    FoodItemID INT AUTO_INCREMENT PRIMARY KEY,
    BaseUnitID INT NOT NULL,
    HouseholdID INT NOT NULL,
    Name VARCHAR(100) NOT NULL,
    Type VARCHAR(100),
    Category VARCHAR(100),
    PreferredPackageID INT NULL,
    IsArchived BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (HouseholdID) REFERENCES Household(HouseholdID),
    FOREIGN KEY (BaseUnitID) REFERENCES BaseUnit(UnitID),
    CONSTRAINT unique_food UNIQUE (Name, Type, HouseholdID)
);

CREATE TABLE Package (
    PackageID INT AUTO_INCREMENT PRIMARY KEY,
    FoodItemID INT NOT NULL,
    Label VARCHAR(100),
    BaseUnitAmt DECIMAL(9,2),
    IsArchived BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (FoodItemID) REFERENCES FoodItem(FoodItemID)
);

CREATE TABLE StockLevel (
    FoodItemID INT NOT NULL,
    TargetLevel DECIMAL(9,2),
    PRIMARY KEY (FoodItemID),
    FOREIGN KEY (FoodItemID) REFERENCES FoodItem(FoodItemID)
);

CREATE TABLE ShoppingList (
    ShoppingListID INT AUTO_INCREMENT PRIMARY KEY,
    HouseholdID INT NOT NULL,
    Status VARCHAR(20) DEFAULT 'active',
    LastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    TotalCost DECIMAL(10, 2),
    FOREIGN KEY (HouseholdID) REFERENCES Household(HouseholdID)
);

CREATE TABLE ShoppingListItem (
    ShoppingListItemID INT AUTO_INCREMENT PRIMARY KEY,
    ShoppingListID INT NOT NULL,
    FoodItemID INT NOT NULL,
    LocationID INT,
    PackageID INT,
    NeededQty DECIMAL(9,2),
    PurchasedQty INT,
    TotalPrice DECIMAL(10, 2),
    Status VARCHAR(20) DEFAULT 'active',
    FOREIGN KEY (ShoppingListID) REFERENCES ShoppingList(ShoppingListID),
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID),
    FOREIGN KEY (PackageID) REFERENCES Package(PackageID),
    FOREIGN KEY (FoodItemID) REFERENCES FoodItem(FoodItemID)
);

CREATE TABLE PriceLog (
    PriceLogID INT AUTO_INCREMENT PRIMARY KEY,
    PackageID INT NOT NULL,
    PriceTotal DECIMAL(10, 2),
    Store VARCHAR(100),
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PackageID) REFERENCES Package(PackageID)
);
CREATE TABLE InventoryTransaction (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    FoodItemID INT NOT NULL,
    LocationID INT NOT NULL,
    UserID INT NOT NULL,
    QtyInBaseUnits DECIMAL(9,2),
    TransactionType VARCHAR(20) NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ExpirationDate DATE,
    FOREIGN KEY (FoodItemID) REFERENCES FoodItem(FoodItemID),
    FOREIGN KEY (LocationID) REFERENCES Location(LocationID),
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);


DROP TRIGGER IF EXISTS update_shoppinglist_event;

DELIMITER $$
CREATE TRIGGER update_shoppinglist_event
AFTER INSERT ON InventoryTransaction
FOR EACH ROW
BEGIN
  DECLARE household_id        INT;
  DECLARE shopping_list_id    INT;
  DECLARE target_level        DECIMAL(10,2);
  DECLARE needed_qty          DECIMAL(10,2);
  DECLARE calculated_qty      DECIMAL(10,2);
  DECLARE p_package_id        INT;
  DECLARE shopping_item_count INT;

  SET household_id = (
    SELECT l.HouseholdID
    FROM Location l
    WHERE l.LocationID = NEW.LocationID
    LIMIT 1
  );

  SET shopping_list_id = (
    SELECT sl.ShoppingListID
    FROM ShoppingList sl
    WHERE sl.HouseholdID = household_id
      AND sl.Status = 'active'
    ORDER BY sl.ShoppingListID DESC
    LIMIT 1
  );

  IF shopping_list_id IS NULL THEN
    INSERT INTO ShoppingList (HouseholdID, Status, LastUpdated)
    VALUES (household_id, 'active', NOW());
  
    SET shopping_list_id = (
      SELECT ShoppingListID
      FROM ShoppingList
      WHERE HouseholdID = household_id
        AND Status = 'active'
      ORDER BY ShoppingListID DESC
      LIMIT 1
    );
  END IF;

  SET target_level = (
    SELECT st.TargetLevel
    FROM StockLevel st
    WHERE st.FoodItemID = NEW.FoodItemID
    LIMIT 1
  );

  IF target_level IS NOT NULL THEN
    SET calculated_qty = (
      SELECT SUM(
        CASE
          WHEN TransactionType IN ('add','purchase','transfer_in') THEN QtyInBaseUnits
          WHEN TransactionType IN ('remove','expire','transfer_out') THEN -QtyInBaseUnits
          ELSE 0
        END
      )
      FROM InventoryTransaction
      WHERE FoodItemID = NEW.FoodItemID
        AND LocationID = NEW.LocationID
    );

    IF calculated_qty IS NULL THEN
      SET calculated_qty = 0;
    END IF;

    IF target_level - calculated_qty > 0 THEN
      SET needed_qty = target_level - calculated_qty;
    ELSE
      SET needed_qty = 0;
    END IF;

    IF needed_qty > 0 THEN
      SET p_package_id = (
        SELECT PreferredPackageID
        FROM FoodItem
        WHERE FoodItemID = NEW.FoodItemID
        LIMIT 1
      );

      IF p_package_id IS NULL THEN
        SET p_package_id = (
          SELECT p.PackageID
          FROM Package p
          WHERE p.FoodItemID = NEW.FoodItemID
          ORDER BY p.PackageID DESC
          LIMIT 1
        );
      END IF;

      SET shopping_item_count = (
        SELECT COUNT(*)
        FROM ShoppingListItem s
        WHERE s.ShoppingListID = shopping_list_id
          AND s.FoodItemID     = NEW.FoodItemID
          AND s.LocationID     = NEW.LocationID
      );

      IF shopping_item_count > 0 THEN
        IF p_package_id IS NOT NULL THEN
          UPDATE ShoppingListItem s
          SET s.NeededQty = needed_qty,
              s.Status    = 'active',
              s.PackageID = p_package_id
          WHERE s.ShoppingListID = shopping_list_id
            AND s.FoodItemID     = NEW.FoodItemID
            AND s.LocationID     = NEW.LocationID;
        ELSE
          UPDATE ShoppingListItem s
          SET s.NeededQty = needed_qty,
              s.Status    = 'active'
          WHERE s.ShoppingListID = shopping_list_id
            AND s.FoodItemID     = NEW.FoodItemID
            AND s.LocationID     = NEW.LocationID;
        END IF;
      ELSE
        INSERT INTO ShoppingListItem
          (ShoppingListID,  FoodItemID,      LocationID,     PackageID,    NeededQty, Status)
        VALUES
          (shopping_list_id, NEW.FoodItemID, NEW.LocationID, p_package_id, needed_qty, 'active');
      END IF;

    ELSE
      DELETE FROM ShoppingListItem
      WHERE ShoppingListID = shopping_list_id
        AND FoodItemID     = NEW.FoodItemID
        AND LocationID     = NEW.LocationID
        AND Status         = 'active';
    END IF;
  END IF;
END$$
DELIMITER ;


DROP FUNCTION IF EXISTS GetCurrentStock;

DELIMITER $$
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
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS GetHouseholdInventory;

DELIMITER $$
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
        AND (p.IsArchived = 0 OR p.IsArchived IS NULL)
    JOIN BaseUnit bu 
        ON f.BaseUnitID = bu.UnitID
    WHERE f.HouseholdID = p_HouseholdID
      AND f.IsArchived = 0
      AND (p_SearchQuery IS NULL OR p_SearchQuery = '' OR LOWER(f.Name) LIKE CONCAT('%', LOWER(p_SearchQuery), '%'))
    ORDER BY f.FoodItemID DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS GetInventoryByLocation;

DELIMITER $$
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
        AND (p.IsArchived = 0 OR p.IsArchived IS NULL)
    JOIN BaseUnit bu ON f.BaseUnitID = bu.UnitID
    JOIN InventoryTransaction i ON f.FoodItemID = i.FoodItemID
    JOIN Location l ON i.LocationID = l.LocationID
    WHERE f.HouseholdID = p_HouseholdID
      AND f.IsArchived = 0
      AND l.LocationID = p_LocationID
      AND (p_SearchQuery IS NULL OR p_SearchQuery = '' OR LOWER(f.Name) LIKE CONCAT('%', LOWER(p_SearchQuery), '%'))
    GROUP BY f.FoodItemID, f.Name, f.Type, f.Category, p.Label, p.BaseUnitAmt, bu.Abbreviation
    HAVING TotalQtyInBaseUnits > 0
    ORDER BY f.FoodItemID DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS AddRemoveExistingFoodItem;

DELIMITER $$
CREATE PROCEDURE AddRemoveExistingFoodItem(
    IN f_FoodItemID INT,
    IN l_LocationID INT,
    IN u_UserID INT,
    IN i_TransactionType VARCHAR(20),
    IN quantity DECIMAL(9,2),
    IN i_ExpirationDate DATE
)
BEGIN
    DECLARE current_qty DECIMAL(9,2);
    DECLARE exp_date DATE;

    START TRANSACTION;

    SELECT SUM(
        CASE
            WHEN TransactionType IN ('add','purchase','transfer_in') THEN QtyInBaseUnits
            WHEN TransactionType IN ('remove','expire','transfer_out') THEN -QtyInBaseUnits
            ELSE 0
        END
    )
    INTO current_qty
    FROM InventoryTransaction
    WHERE FoodItemID = f_FoodItemID
    FOR UPDATE;

    IF current_qty IS NULL THEN
        SET current_qty = 0;
    END IF;

    IF i_TransactionType IN ('remove','expire','transfer_out') AND current_qty < quantity THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Insufficient stock for this removal';
    END IF;

    IF i_TransactionType = 'expire' THEN
        UPDATE InventoryTransaction
        SET ExpirationDate = CURDATE()
        WHERE FoodItemID = f_FoodItemID
          AND ExpirationDate IS NOT NULL
          AND ExpirationDate > CURDATE();
    END IF;

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

    COMMIT;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS AddNewFoodItem;

DELIMITER $$
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
END$$
DELIMITER ;


INSERT INTO BaseUnit (MeasurementType, Abbreviation)
VALUES
('Mass', 'g'),
('Volume', 'ml'),
('Count', 'pc'),
('Mass', 'mg'),
('Mass', 'kg'),
('Mass', 'oz'),
('Mass', 'lb'),
('Volume', 'L'),
('Volume', 'cup'),
('Count', 'pack');


-- SL Updates
DROP PROCEDURE IF EXISTS UpdateShoppingListItemsJSON;

DELIMITER $$
CREATE PROCEDURE UpdateShoppingListItemsJSON(
    IN sl_id INT,
    IN sl_items JSON
)
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE n INT DEFAULT JSON_LENGTH(sl_items);

    DECLARE food_item_id INT;
    DECLARE location_id INT;
    DECLARE package_id INT;
    DECLARE needed_qty DECIMAL(10,2);
    DECLARE purchased_qty DECIMAL(10,2);
    DECLARE total_price DECIMAL(10,2);
    DECLARE status_val VARCHAR(20);

    DECLARE list_total DECIMAL(10,2) DEFAULT 0;

    -- Disable safe updates to allow deletion by ShoppingListID
    SET SQL_SAFE_UPDATES = 0;

    START TRANSACTION;

    -- Remove all items from the current list
    DELETE FROM ShoppingListItem WHERE ShoppingListID = sl_id;

    -- Re-insert all items from JSON
    WHILE i < n DO
        SET food_item_id   = JSON_EXTRACT(sl_items, CONCAT('$[', i, '].FoodItemID'));
        SET location_id    = JSON_EXTRACT(sl_items, CONCAT('$[', i, '].LocationID'));
        SET package_id     = JSON_EXTRACT(sl_items, CONCAT('$[', i, '].PackageID'));
        SET needed_qty     = JSON_EXTRACT(sl_items, CONCAT('$[', i, '].NeededQuantity'));
        SET purchased_qty  = JSON_EXTRACT(sl_items, CONCAT('$[', i, '].PurchasedQuantity'));
        SET total_price    = JSON_EXTRACT(sl_items, CONCAT('$[', i, '].TotalPrice'));
        SET status_val     = JSON_UNQUOTE(JSON_EXTRACT(sl_items, CONCAT('$[', i, '].Status')));

        INSERT INTO ShoppingListItem (
            ShoppingListID,
            FoodItemID,
            LocationID,
            PackageID,
            NeededQty,
            PurchasedQty,
            TotalPrice,
            Status
        ) VALUES (
            sl_id, food_item_id, location_id, package_id,
            needed_qty, purchased_qty, total_price, IFNULL(status_val, 'active')
        );

        SET list_total = list_total + total_price;
        SET i = i + 1;
    END WHILE;

    -- Update Shopping List totals
    UPDATE ShoppingList
    SET TotalCost = list_total,
        LastUpdated = CURRENT_TIMESTAMP
    WHERE ShoppingListID = sl_id;

    COMMIT;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS getShoppingListByParam;

DELIMITER $$
CREATE PROCEDURE getShoppingListByParam(
  IN param INT,
  IN orderbool BOOL  
)
BEGIN
  DECLARE offset_val INT;
-- sort by id
    IF param = 0 THEN
        IF orderbool THEN
            SELECT *
            FROM ShoppingList
            ORDER BY ShoppingListID ASC;
        ELSE
            SELECT *
            FROM ShoppingList
            ORDER BY ShoppingListID DESC;
        END IF;
-- sort by last updated date
    ELSEIF param = 1 THEN
        IF orderbool THEN
            SELECT *
            FROM ShoppingList
            ORDER BY LastUpdated ASC;
        ELSE
            SELECT *
            FROM ShoppingList
            ORDER BY LastUpdated DESC;
        END IF;
-- sort by status
    ELSEIF param = 2 THEN
        IF orderbool THEN
            SELECT *
            FROM ShoppingList
            ORDER BY Status ASC;
        ELSE
            SELECT *
            FROM ShoppingList
            ORDER BY Status DESC;
        END IF;
-- sort by total price
    ELSE
        IF orderbool THEN
            SELECT *
            FROM ShoppingList
            ORDER BY TotalCost ASC;
        ELSE
            SELECT *
            FROM ShoppingList
            ORDER BY TotalCost DESC;
        END IF;
    END IF;
END$$
DELIMITER ;

DROP USER IF EXISTS 'stocker_app'@'localhost';

CREATE USER IF NOT EXISTS 'stocker_app'@'localhost' IDENTIFIED BY '2zC4ngpg2b6F';
GRANT SELECT ON stocker.* TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.FoodItem TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.Household TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.InventoryTransaction TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.Location TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.Package TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.PriceLog TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.ShoppingList TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.StockLevel TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.Users TO 'stocker_app'@'localhost';
GRANT INSERT, UPDATE ON stocker.ShoppingListItem TO 'stocker_app'@'localhost';
GRANT DELETE ON stocker.ShoppingListItem TO 'stocker_app'@'localhost';
GRANT DELETE ON stocker.Users           TO 'stocker_app'@'localhost';

GRANT EXECUTE ON PROCEDURE stocker.AddNewFoodItem TO 'stocker_app'@'localhost';
GRANT EXECUTE ON PROCEDURE stocker.AddRemoveExistingFoodItem TO 'stocker_app'@'localhost';
GRANT EXECUTE ON PROCEDURE stocker.GetHouseholdInventory TO 'stocker_app'@'localhost';
GRANT EXECUTE ON PROCEDURE stocker.GetInventoryByLocation TO 'stocker_app'@'localhost';
GRANT EXECUTE ON PROCEDURE stocker.getShoppingListByParam TO 'stocker_app'@'localhost';
GRANT EXECUTE ON PROCEDURE stocker.UpdateShoppingListItemsJSON TO 'stocker_app'@'localhost';
GRANT EXECUTE ON FUNCTION stocker.GetCurrentStock TO 'stocker_app'@'localhost';
SHOW GRANTS FOR 'stocker_app'@'localhost';