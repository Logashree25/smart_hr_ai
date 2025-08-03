using hr from '../db/schema';

service HRService @(path: '/hr') {

  // Core HR entities
  @cds.redirection.target
  entity Employees as projection on hr.Employees;
  entity SatisfactionSurvey as projection on hr.SatisfactionSurvey;
  entity Feedback as projection on hr.Feedback;
  entity PerformanceMetrics as projection on hr.PerformanceMetrics;
  entity AttritionRisk as projection on hr.AttritionRisk;
  entity OpenPositions as projection on hr.OpenPositions;
  entity EngagementIdea as projection on hr.EngagementIdea;
  entity PolicyEnhancement as projection on hr.PolicyEnhancement;

  // Enhanced views for analytics
  view EmployeeInsights as select from hr.Employees {
    *
  };

  view DepartmentSummary as select from hr.Employees {
    Department,
    count(*) as EmployeeCount : Integer
  } group by Department;

  view AttritionRiskSummary as select from hr.AttritionRisk {
    UrgencyLevel,
    count(*) as EmployeeCount : Integer,
    avg(RiskScore) as AvgRiskScore : Decimal(5,2)
  } group by UrgencyLevel;

  // AI-powered actions
  action generateAttritionRisk(employeeId: Integer) returns {
    success: Boolean;
    message: String;
    riskScore: Decimal(5,2);
  };



  action analyzeTeamPerformance(department: String) returns {
    success: Boolean;
    analysis: {
      avgCompletion: Decimal(5,2);
      topPerformers: array of String;
      improvementAreas: array of String;
    };
  };

}
