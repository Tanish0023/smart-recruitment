import { gql } from "@apollo/client";

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────

export const GET_ALL_JOBS = gql`
  query GetAllJobs {
    allJobs {
      id
      title
      description
      location
      salaryRange
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
      location
      salaryRange
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
      location
      salaryRange
      isActive
      createdAt
      updatedAt
      company {
        id
        name
      }
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
  query GetJobApplicants($jobId: Int!) {
    jobApplicants(jobId: $jobId) {
      id
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

// ─────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────

export const CREATE_JOB = gql`
  mutation CreateJob(
    $title: String!
    $description: String!
    $location: String
    $salaryRange: String
  ) {
    createJob(
      title: $title
      description: $description
      location: $location
      salaryRange: $salaryRange
    ) {
      job {
        id
        title
        description
        location
        salaryRange
        isActive
        createdAt
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
    $isActive: Boolean
  ) {
    updateJob(
      jobId: $jobId
      title: $title
      description: $description
      location: $location
      salaryRange: $salaryRange
      isActive: $isActive
    ) {
      job {
        id
        title
        description
        location
        salaryRange
        isActive
        updatedAt
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
  mutation ApplyToJob($jobId: Int!, $resume: Upload!) {
    applyToJob(jobId: $jobId, resume: $resume) {
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
