export function mapMetafieldTypeToFilterType(typeName, category) {
    if (typeName === "boolean") {
      return "boolean";
    }
  
    if (
      typeName === "number_integer" ||
      typeName === "number_decimal" ||
      typeName === "dimension" ||
      category === "MEASUREMENT"
    ) {
      return "range";
    }
  
    return "list";
  }
  
  export function metafieldDefinitionToFilter(definition, sortOrder = 1) {
    return {
      id: `mf_${definition.namespace}_${definition.key}`,
      label: definition.name || `${definition.namespace}.${definition.key}`,
      source: "metafield",
      namespace: definition.namespace,
      key: definition.key,
      type: mapMetafieldTypeToFilterType(definition.type, definition.category),
      enabled: true,
      sortOrder
    };
  }