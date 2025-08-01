using hr from '../db/schema';

service HRService @(path: '/hr') {

  // Employee management
  @cds.redirection.target
  entity Employees as projection on hr.Employees;

  // Survey and feedback data
  entity SatisfactionSurvey as projection on hr.SatisfactionSurvey;
  entity Feedback as projection on hr.Feedback;

  // Performance tracking
  entity PerformanceMetrics as projection on hr.PerformanceMetrics;

  // AI insights and recommendations
  @cds.redirection.target
  entity AttritionRisk as projection on hr.AttritionRisk;
  entity TrainingRecommendation as projection on hr.TrainingRecommendation;
  entity EngagementIdea as projection on hr.EngagementIdea;
  entity PolicyEnhancement as projection on hr.PolicyEnhancement;

  // Job management
  entity OpenPositions as projection on hr.OpenPositions;

  // Custom views for analytics
  view EmployeeInsights as select from hr.Employees {
    ID,
    FirstName,
    LastName,
    Role,
    Department,
    HireDate,
    IsKeyTalent,
    Manager.FirstName as ManagerFirstName,
    Manager.LastName as ManagerLastName
  };

  view DepartmentSummary as select from hr.Employees {
    key Department,
    count(*) as EmployeeCount : Integer,
    count(case when IsKeyTalent = true then 1 end) as KeyTalentCount : Integer
  } group by Department;

  view AttritionRiskSummary as select from hr.AttritionRisk {
    key EmployeeID.Department as Department,
    avg(RiskScore) as AvgRiskScore : Decimal(5,2),
    count(*) as EmployeesAtRisk : Integer
  } group by EmployeeID.Department;

  // Actions for AI-powered insights
  action generateAttritionRisk(employeeId: String) returns String;
  action generateTrainingRecommendations(employeeId: String) returns String;
  action generateEngagementIdeas(department: String) returns String;
  action analyzePolicyGaps() returns String;
  action analyzeTeamPerformance(department: String) returns String;
}
