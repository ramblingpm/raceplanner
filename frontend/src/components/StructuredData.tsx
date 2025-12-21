interface StructuredDataProps {
  data: object | object[];
}

/**
 * Component for injecting JSON-LD structured data into the page
 * Accepts a single schema object or an array of schemas
 */
export default function StructuredData({ data }: StructuredDataProps) {
  const schemas = Array.isArray(data) ? data : [data];

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
