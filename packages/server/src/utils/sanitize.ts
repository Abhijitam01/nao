interface ValidationResult {
  valid: boolean;
  reason?: string;
}

// Dangerous SQL keywords that should never appear in user queries
const FORBIDDEN_KEYWORDS = [
  "DROP",
  "DELETE",
  "INSERT",
  "UPDATE",
  "ALTER",
  "CREATE",
  "TRUNCATE",
  "REPLACE",
  "EXEC",
  "EXECUTE",
  "GRANT",
  "REVOKE",
  "ATTACH",
  "DETACH",
];

export function validateSQL(sql: string): ValidationResult {
  if (!sql || sql.trim() === "") {
    return { valid: false, reason: "Empty SQL query" };
  }

  const normalized = sql.trim().toUpperCase();

  // Must start with SELECT or WITH (for CTEs)
  if (!normalized.startsWith("SELECT") && !normalized.startsWith("WITH")) {
    return {
      valid: false,
      reason: "Query must start with SELECT or WITH",
    };
  }

  // Check for forbidden keywords
  // Use word boundary matching to avoid false positives (e.g., "UPDATED_AT" column)
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(sql)) {
      return {
        valid: false,
        reason: `Forbidden keyword detected: ${keyword}`,
      };
    }
  }

  // Check for multiple statements (semicolons followed by more SQL)
  const withoutStrings = sql.replace(/'[^']*'/g, ""); // strip string literals
  if (withoutStrings.includes(";")) {
    const afterSemicolon = withoutStrings.split(";").slice(1).join("").trim();
    if (afterSemicolon.length > 0) {
      return {
        valid: false,
        reason: "Multiple SQL statements are not allowed",
      };
    }
  }

  return { valid: true };
}
