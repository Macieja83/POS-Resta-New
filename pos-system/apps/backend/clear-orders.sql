-- Skrypt do czyszczenia wszystkich zamówień
-- Uwaga: To usunie wszystkie zamówienia, pozycje zamówień i dostawy

-- Usuń wszystkie zamówienia (OrderItem i Delivery zostaną usunięte automatycznie przez CASCADE)
DELETE FROM orders;

-- Sprawdź ile zostało zamówień
SELECT COUNT(*) as remaining_orders FROM orders;
