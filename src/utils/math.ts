/**
 * Get the polygon vertex coordinates
 * @param edges variable
 * @param radius radius
 * @returns Coordinate array
 */
const getPolygonVertices = (edges: number, radius: number) => {
  const vertices = [];
  const interiorAngle = (Math.PI * 2) / edges;
  let rotationAdjustment = -Math.PI / 2;
  if (edges % 2 === 0) {
    rotationAdjustment += interiorAngle / 2;
  }
  for (let i = 0; i < edges; i++) {
    // Painting circular to take a vertex coordinates
    const rad = i * interiorAngle + rotationAdjustment;
    vertices.push({
      x: Math.cos(rad) * radius,
      y: Math.sin(rad) * radius,
    });
  }
  return vertices;
};

export { getPolygonVertices };
