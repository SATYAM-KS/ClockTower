-- SQL to add MIT Alandi as a red zone with high incident count
-- MIT Alandi coordinates: 18.6789, 73.8867 (Pune, Maharashtra, India)

INSERT INTO public.red_zones (
    name,
    latitude,
    longitude,
    crime_rate,
    incident_count,
    last_incident,
    radius,
    risk_level,
    created_at
) VALUES (
    'MIT Alandi Campus',
    18.6789,
    73.8867,
    85.5,  -- High crime rate
    75,    -- Incident count more than 70
    NOW(), -- Current timestamp for last incident
    500,   -- 500 meter radius
    'high', -- High risk level
    NOW()  -- Current timestamp for created_at
);

-- Verify the insertion
SELECT 
    id,
    name,
    latitude,
    longitude,
    crime_rate,
    incident_count,
    risk_level,
    created_at
FROM public.red_zones 
WHERE name = 'MIT Alandi Campus'
ORDER BY created_at DESC
LIMIT 1;
