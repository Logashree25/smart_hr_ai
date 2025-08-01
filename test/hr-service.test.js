const fs = require('fs');
const path = require('path');

describe('HR Service Tests', () => {

  describe('File Structure Tests', () => {
    it('should have all required CDS files', () => {
      const requiredFiles = [
        'db/schema.cds',
        'srv/hr-service.cds',
        'srv/hr-service.js'
      ];

      for (const file of requiredFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Missing file: ${file}`);
        }
      }
      console.log('✅ All required CDS files found');
    });

    it('should have sample data files', () => {
      const dataFiles = [
        'db/data/hr-Employees.csv',
        'db/data/hr-SatisfactionSurvey.csv',
        'db/data/hr-PerformanceMetrics.csv',
        'db/data/hr-OpenPositions.csv',
        'db/data/hr-Feedback.csv'
      ];

      for (const file of dataFiles) {
        const filePath = path.join(__dirname, '..', file);
        if (!fs.existsSync(filePath)) {
          throw new Error(`Missing data file: ${file}`);
        }
      }
      console.log('✅ All sample data files found');
    });
  });

  describe('Schema Validation', () => {
    it('should have valid schema definition', () => {
      const schemaPath = path.join(__dirname, '..', 'db/schema.cds');
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');

      // Check for required entities
      const requiredEntities = [
        'entity Employees',
        'entity SatisfactionSurvey',
        'entity Feedback',
        'entity PerformanceMetrics',
        'entity AttritionRisk',
        'entity OpenPositions',
        'entity TrainingRecommendation',
        'entity EngagementIdea',
        'entity PolicyEnhancement'
      ];

      for (const entity of requiredEntities) {
        if (!schemaContent.includes(entity)) {
          throw new Error(`Missing entity definition: ${entity}`);
        }
      }
      console.log('✅ All required entities found in schema');
    });

    it('should have valid service definition', () => {
      const servicePath = path.join(__dirname, '..', 'srv/hr-service.cds');
      const serviceContent = fs.readFileSync(servicePath, 'utf8');

      // Check for service definition
      if (!serviceContent.includes('service HRService')) {
        throw new Error('HRService not defined');
      }

      // Check for actions
      const requiredActions = [
        'action generateAttritionRisk',
        'action generateTrainingRecommendations',
        'action generateEngagementIdeas',
        'action analyzePolicyGaps',
        'action analyzeTeamPerformance'
      ];

      for (const action of requiredActions) {
        if (!serviceContent.includes(action)) {
          throw new Error(`Missing action: ${action}`);
        }
      }
      console.log('✅ Service definition and actions validated');
    });
  });

  describe('Implementation Validation', () => {
    it('should have service implementation', () => {
      const implPath = path.join(__dirname, '..', 'srv/hr-service.js');
      const implContent = fs.readFileSync(implPath, 'utf8');

      // Check for implementation structure
      if (!implContent.includes('module.exports = cds.service.impl')) {
        throw new Error('Service implementation not found');
      }

      // Check for action implementations
      const requiredImplementations = [
        'generateAttritionRisk',
        'generateTrainingRecommendations',
        'generateEngagementIdeas',
        'analyzePolicyGaps',
        'analyzeTeamPerformance'
      ];

      for (const impl of requiredImplementations) {
        if (!implContent.includes(impl)) {
          throw new Error(`Missing implementation: ${impl}`);
        }
      }
      console.log('✅ Service implementation validated');
    });
  });
});
