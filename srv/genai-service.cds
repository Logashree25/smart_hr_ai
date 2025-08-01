using hr from '../db/schema';

service GenAIService @(path: '/genai') {

  // AI-powered feedback analysis
  action summarizeFeedback(
    employeeID : Integer,
    timeframe : String
  ) returns {
    summary : String;
  };

  // AI-powered attrition risk explanation
  action explainAttritionRisk(
    employeeID : Integer
  ) returns {
    explanation : String;
  };

  // AI-powered training recommendations
  action suggestTraining(
    employeeID : Integer,
    gaps : String
  ) returns {
    plan : String;
  };

  // AI-powered engagement ideas generation
  action getEngagementIdeas(
    department : String,
    recentTrends : String
  ) returns {
    ideas : String;
  };

  // AI-powered policy enhancement suggestions
  action policyEnhancements(
    recurrentThemes : String
  ) returns {
    suggestions : String;
  };

  // AI-powered hiring prioritization
  action prioritizeHiring(
    openRolesContext : String,
    attritionForecast : String
  ) returns {
    recommendation : String;
  };

}
