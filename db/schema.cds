namespace hr;

// Employee & profile
entity Employees {
  key ID            : String(36); // UUID format
  FirstName         : String(100);
  LastName          : String(100);
  Role              : String(100);
  Department        : String(100);
  ManagerID         : String(36); // UUID format
  HireDate          : Date;
  IsKeyTalent       : Boolean;

  // Navigation properties for hierarchical relationships
  Manager           : Association to Employees on Manager.ID = ManagerID;
  DirectReports     : Association to many Employees on DirectReports.ManagerID = ID;

  // Navigation to related entities
  SurveyResponses   : Association to many SatisfactionSurvey on SurveyResponses.EmployeeID = $self;
  FeedbackReceived  : Association to many Feedback on FeedbackReceived.EmployeeID = $self;
  FeedbackGiven     : Association to many Feedback on FeedbackGiven.FromUserID = $self;
  PerformanceData   : Association to many PerformanceMetrics on PerformanceData.EmployeeID = $self;
  AttritionRisk     : Association to one AttritionRisk on AttritionRisk.EmployeeID = $self;
  TrainingRecs      : Association to many TrainingRecommendation on TrainingRecs.EmployeeID = $self;
}

// Satisfaction / engagement
entity SatisfactionSurvey {
  key ID            : String(36); // UUID format
  EmployeeID        : Association to Employees;
  SurveyDate        : DateTime;
  Score             : Integer;     // e.g., 0–100
  Comments          : LargeString;
}

// Free-form feedback (for AI summarization)
entity Feedback {
  key ID            : String(36); // UUID format
  EmployeeID        : Association to Employees;
  FromUserID        : Association to Employees;
  Date              : DateTime;
  Text              : LargeString;
  Type              : String;      // e.g., peer, manager, upward
}

// Performance trends
entity PerformanceMetrics {
  key ID            : String(36); // UUID format
  EmployeeID        : Association to Employees;
  Period            : String;      // e.g., "2025-Q2"
  Score             : Decimal(5,2);
  GoalsMet          : Integer;
  ManagerRating     : Integer;
}

// Attrition monitoring
entity AttritionRisk {
  key EmployeeID    : Association to Employees;
  RiskScore         : Decimal(5,2); // 0..1 or percentage
  LastUpdated       : DateTime;
  Explanation       : LargeString; // AI-generated reason
  UrgencyLevel      : String;      // e.g., High / Medium / Low
}

// Hiring needs
entity OpenPositions {
  key ID            : String(36); // UUID format
  Role              : String(100);
  Department        : String(100);
  CreatedDate       : Date;
  Status            : String;       // open, interviewing, offer, filled
  RequiredBy        : Date;
  UrgencyScore      : Decimal(5,2); // derived priority
}

// AI suggestion panel
entity EngagementIdea {
  key ID            : String(36); // UUID format
  Department        : String(100);
  GeneratedDate     : DateTime;
  IdeaText          : LargeString;
  ImpactEstimate    : String;      // e.g., High / Medium / Low
}

entity TrainingRecommendation {
  key ID                : String(36); // UUID format
  EmployeeID            : Association to Employees;
  GeneratedDate         : DateTime;
  RecommendationText    : LargeString;
  ConfidenceScore       : Decimal(5,2);
}

entity PolicyEnhancement {
  key ID                : String(36); // UUID format
  GeneratedDate         : DateTime;
  Theme                 : String(200);
  SuggestionText        : LargeString;
  Rationale             : LargeString;
}
