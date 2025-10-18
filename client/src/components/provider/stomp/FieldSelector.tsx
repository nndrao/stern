/**
 * Field Selector Types
 * Hierarchical field tree structure for schema display
 */

export interface FieldNode {
  path: string;                   // Full dot-notation path
  name: string;                   // Display name (last segment)
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  nullable: boolean;
  sample?: any;
  children?: FieldNode[];         // Child fields for objects
}

/**
 * Convert FieldInfo to FieldNode
 */
export function convertFieldInfoToNode(fieldInfo: any): FieldNode {
  return {
    path: fieldInfo.path,
    name: fieldInfo.path.split('.').pop() || fieldInfo.path,
    type: fieldInfo.type,
    nullable: fieldInfo.nullable,
    sample: fieldInfo.sample,
    children: fieldInfo.children
      ? Object.values(fieldInfo.children).map(convertFieldInfoToNode)
      : undefined,
  };
}

/**
 * Convert FieldNode to FieldInfo
 */
export function convertFieldNodeToInfo(node: FieldNode): any {
  const info: any = {
    path: node.path,
    type: node.type,
    nullable: node.nullable,
    sample: node.sample,
  };

  if (node.children) {
    info.children = {};
    node.children.forEach(child => {
      const childName = child.path.split('.').pop() || child.path;
      info.children[childName] = convertFieldNodeToInfo(child);
    });
  }

  return info;
}

/**
 * Collect all non-object leaf paths from a field node
 */
export function collectNonObjectLeaves(field: FieldNode): string[] {
  const leaves: string[] = [];

  if (!field.children || field.children.length === 0) {
    // Leaf node
    if (field.type !== 'object') {
      leaves.push(field.path);
    }
  } else {
    // Has children - recurse
    field.children.forEach(child => {
      leaves.push(...collectNonObjectLeaves(child));
    });
  }

  return leaves;
}

/**
 * Find a field node by path in the field tree
 */
export function findFieldByPath(path: string, fields: FieldNode[]): FieldNode | null {
  for (const field of fields) {
    if (field.path === path) {
      return field;
    }
    if (field.children) {
      const found = findFieldByPath(path, field.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Filter fields based on search query
 */
export function filterFields(fields: FieldNode[], query: string): FieldNode[] {
  if (!query) return fields;

  const lowerQuery = query.toLowerCase();

  return fields.reduce((acc: FieldNode[], field) => {
    const matchesQuery =
      field.path.toLowerCase().includes(lowerQuery) ||
      field.name.toLowerCase().includes(lowerQuery);

    if (field.children) {
      const filteredChildren = filterFields(field.children, query);
      if (matchesQuery || filteredChildren.length > 0) {
        acc.push({
          ...field,
          children: filteredChildren.length > 0 ? filteredChildren : field.children
        });
      }
    } else if (matchesQuery) {
      acc.push(field);
    }

    return acc;
  }, []);
}

/**
 * Checkbox tree node type for react-checkbox-tree
 */
export interface CheckboxTreeNode {
  value: string;                    // Unique ID (full path)
  label: string;                    // Display name
  children?: CheckboxTreeNode[];    // Child nodes
  className?: string;               // Custom CSS class
  showCheckbox?: boolean;           // Show/hide checkbox for this node
  // Custom metadata for rendering
  fieldType?: string;               // Field type for badge
  sample?: any;                     // Sample value
  isLeaf?: boolean;                 // Is leaf field (selectable)
}

/**
 * Convert hierarchical FieldNode tree to react-checkbox-tree format
 */
export function convertFieldsToCheckboxTree(fields: FieldNode[]): CheckboxTreeNode[] {
  const convert = (field: FieldNode): CheckboxTreeNode => {
    const isLeaf = field.type !== 'object' || !field.children || field.children.length === 0;

    const node: CheckboxTreeNode = {
      value: field.path,              // Use full path as unique ID
      label: field.name,              // Display just the field name
      fieldType: field.type,          // Store type for badge rendering
      sample: field.sample,           // Store sample for display
      isLeaf: isLeaf,
      showCheckbox: isLeaf,           // Only show checkbox on leaf nodes
    };

    if (field.children && field.children.length > 0) {
      node.children = field.children.map(child => convert(child));
    }

    return node;
  };

  return fields.map(field => convert(field));
}
