import { gql } from "@apollo/client";

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────

export const GET_ALL_JOBS = gql`
  query GetAllJobs($limit: Int, $offset: Int) {
    allJobs(limit: $limit, offset: $offset) {
      id
      title
      description
      categories {
        id
        name
      }
      location
      salaryRange
      minimumExperienceRequired
      createdAt
      company {
        id
        name
      }
    }
  }
`;

export const GET_JOB_DETAIL = gql`
  query GetJobDetail($jobId: Int!) {
    jobDetail(jobId: $jobId) {
      id
      title
      description
      categories {
        id
        name
      }
      location
      salaryRange
      minimumExperienceRequired
      createdAt
      updatedAt
      isActive
      company {
        id
        name
        website
      }
      createdBy {
        id
        username
      }
    }
  }
`;

export const GET_COMPANY_JOBS = gql`
  query GetCompanyJobs {
    companyJobs {
      id
      title
      description
      categories {
        id
        name
      }
      location
      salaryRange
      minimumExperienceRequired
      isActive
      createdAt
      updatedAt
      skills {
        id
        name
        category {
          id
          name
        }
      }
      company {
        id
        name
      }
    }
  }
`;

export const GET_ALL_SKILLS = gql`
  query GetAllSkills {
    allSkills {
      id
      name
      category {
        id
        name
      }
    }
  }
`;

export const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    allCategories {
      id
      name
      description
    }
  }
`;

export const GET_MY_APPLICATIONS = gql`
  query GetMyApplications {
    myApplications {
      id
      status
      appliedAt
      job {
        id
        title
        location
        salaryRange
        company {
          id
          name
        }
      }
    }
  }
`;

export const GET_JOB_APPLICANTS = gql`
  query GetJobApplicants($jobId: Int!, $sortBy: ApplicantsSortEnum!) {
    jobApplicants(jobId: $jobId, sortBy: $sortBy) {
      id
      score
      status
      appliedAt
      resumeUrl
      applicant {
        id
        username
        email
      }
    }
  }
`;

export const GET_JOB_QUESTIONS = gql`
  query GetJobQuestions($jobId: Int!) {
    jobQuestions(jobId: $jobId) {
      id
      question
      createdAt
    }
  }
`;

// ─────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────

export const CREATE_JOB = gql`
  mutation CreateJob(
    $title: String!
    $description: String!
    $location: String
    $salaryRange: String
    $minimumExperienceRequired: Int
    $skills: [Int!]
    $categories: [Int!]
  ) {
    createJob(
      title: $title
      description: $description
      location: $location
      salaryRange: $salaryRange
      minimumExperienceRequired: $minimumExperienceRequired
      skills: $skills
      categories: $categories
    ) {
      job {
        id
        title
        description
        location
        salaryRange
        minimumExperienceRequired
        isActive
        createdAt
        categories {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_JOB = gql`
  mutation UpdateJob(
    $jobId: Int!
    $title: String
    $description: String
    $location: String
    $salaryRange: String
    $minimumExperienceRequired: Int
    $isActive: Boolean
    $skills: [Int!]
    $categories: [Int!]
  ) {
    updateJob(
      jobId: $jobId
      title: $title
      description: $description
      location: $location
      salaryRange: $salaryRange
      minimumExperienceRequired: $minimumExperienceRequired
      isActive: $isActive
      skills: $skills
      categories: $categories
    ) {
      job {
        id
        title
        description
        location
        salaryRange
        minimumExperienceRequired
        isActive
        updatedAt
        skills {
          id
          name
        }
        categories {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_JOB = gql`
  mutation DeleteJob($jobId: Int!) {
    deleteJob(jobId: $jobId) {
      success
    }
  }
`;

export const APPLY_TO_JOB = gql`
  mutation ApplyToJob($jobId: Int!) {
    applyToJob(jobId: $jobId) {
      application {
        id
        status
        appliedAt
      }
    }
  }
`;

export const UPDATE_APPLICATION_STATUS = gql`
  mutation UpdateApplicationStatus($applicationId: Int!, $status: String!) {
    updateApplicationStatus(applicationId: $applicationId, status: $status) {
      application {
        id
        status
      }
    }
  }
`;

export const GENERATE_AI_JOB_QUESTIONS = gql`
  mutation GenerateAiJobQuestions($jobId: Int!, $count: Int) {
    generateAiJobQuestions(jobId: $jobId, count: $count) {
      success
      queued
      requestedCount
      availableSlots
      message
    }
  }
`;

export const DELETE_JOB_QUESTION = gql`
  mutation DeleteJobQuestion($questionId: Int!) {
    deleteJobQuestion(questionId: $questionId) {
      success
    }
  }
`;
