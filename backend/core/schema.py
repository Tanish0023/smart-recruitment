import graphene
import users.schema
import jobs.schema


class Query(users.schema.Query, jobs.schema.JobQuery, graphene.ObjectType):
    pass


class Mutation(users.schema.Mutation, jobs.schema.JobMutation, graphene.ObjectType):
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
