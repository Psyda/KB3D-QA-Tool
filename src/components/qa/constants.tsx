export const checklistItems = {
  geometry: [
    "Check for realistic scale",
    "Overall orientation",
    "Objects are grouped logically",
    "Pivots are placed logically",
    "Smoothing groups are applied",
    "Normals are correct",
    "There is no floating geometry",
    "There is no intersecting geometry"
  ],
  uv: [
    "Check for stretching and/or seams",
    "Check for non-overlapping UVs"
  ],
  textures: [
    "Naming Conventions are consistent and work in Software/Renderer",
    "Make sure none of the textures are missing",
    "Check that textures don't tile in an obvious way",
    "Materials are applied to objects logically"
  ],
  shaders: [
    "PBR node setup is accurate in each renderer"
  ]
} as const;

export const issueTags = [
  "Cosmetic", "Text/language", "Texture", "UV", "Normal map", 
  "Geometry", "Intersecting faces", "Major Concern", "Moderate Concern", "Minor Concern", "Nitpicking"
] as const;