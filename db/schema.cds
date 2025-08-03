 it should be in UI5 interface onlynamespace hr;

// ---------- Employee & profile ----------
entity Employees {
  key ID                : Integer;          // short numeric key
  FirstName             : String(100);
  LastName              : String(100);
  Role                  : String(100);
  Department            : String(100);
  Team                  : String(100);
  Location              : String(100);
  HireDate              : Date;
  HireType              : String(50);       // Full-time, Contractor, etc.
  TenureMonths          : Integer;          // optional precomputed tenure
}

// ---------- Satisfaction / engagement ----------
entity SatisfactionSurvey {
  key EmployeeID        : Association to Employees;
  key SurveyDate        : DateTime;         // uniquely identifies survey
  Score                 : Integer;          // 0–100
  Comments              : LargeString;
}

// ---------- Free-form feedback ----------
entity Feedback {
  key EmployeeID        : Association to Employees;  // subject of feedback
  key FromUserID        : Association to Employees;  // author of feedback
  key Date              : DateTime;                 // timestamp
  feedback              : LargeString;              // feedback text
  Type                  : String;                   // peer, manager, upward
}

// ---------- Performance trends ----------
entity PerformanceMetrics {
  key ID                : Integer;
  EmployeeID            : Association to Employees;
  Period                : String(50);               // e.g., "2025-Q2"
  ObjectiveCompletionRate : Decimal(5,2);           // % of goals completed
}

// ---------- Attrition monitoring ----------
entity AttritionRisk {
  key EmployeeID        : Association to Employees;
  RiskScore             : Decimal(5,2);     // 0..1 or percentage
  LastUpdated           : DateTime;
  Explanation           : LargeString;      // AI-generated reason
  UrgencyLevel          : String(20);       // High / Medium / Low
}

// ---------- Hiring needs ----------
entity OpenPositions {
  key ID                : Integer;
  Role                  : String(100);
  Department            : String(100);
  CreatedDate           : Date;
  Status                : String;           // open, interviewing, offer, filled
  RequiredBy            : Date;
  Level                 : String(20);       // priority level: High/Medium/Low
}

// ---------- AI suggestion panel ----------
entity EngagementIdea {
  key ID                : Integer;
  Department            : String(100);
  GeneratedDate         : DateTime;
  IdeaText              : LargeString;
  ImpactEstimate        : String(20);       // High / Medium / Low
  Category              : String(100);      // e.g., "Morale", "Recognition"
  Source                : String(200);      // trigger or data origin
  ConfidenceLevel       : Decimal(5,2);     // strength/confidence
}

entity PolicyEnhancement {
  key ID                    : Integer;
  GeneratedDate             : DateTime;
  Theme                     : String(200);    // recurring issue/area
  Suggestion                : LargeString;    // enhancement idea
  Rationale                 : LargeString;    // why it helps
  ExpectedImpact            : String(100);    // anticipated benefit
}
