import { z } from "zod";

  // Validates and normalizes location input.
  // Accepts either a city name or lat/lng coordinates.
 
const LocationSchema = z
  .object({
    city: z.string().min(1).max(200).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (data) => data.city || (data.latitude !== undefined && data.longitude !== undefined),
    {
      message: "Provide either 'city' or both 'latitude' and 'longitude'.",
    }
  );


//  Parse and validate the incoming request body.
//  Returns { location: string } with a normalized location string.

export function validateLocationInput(body) {
  const parsed = LocationSchema.parse(body);

  if (parsed.city) {
    return { location: parsed.city.trim(), type: "city" };
  }

  return {
    location: `${parsed.latitude}, ${parsed.longitude}`,
    type: "coordinates",
    latitude: parsed.latitude,
    longitude: parsed.longitude,
  };
}
