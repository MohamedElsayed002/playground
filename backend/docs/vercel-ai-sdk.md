
# Vercel AI SDK 

The AI SDK standardizes integrating artifical intelligence (AI) models. This enable to foucs on building greate AI applications, not to waste of time on technical details 


## Generative Artifical Intelligence

**Generative artifical intelligence** refers to models that predict and generate various types of outputs (such as text, images, or audio) based on what's statistically likely, pulling from patterns they've learned from their training data, For example:

- Give a photo, a generative model can generate a caption
- Give an audio file, a generative model can generate  a transcription.
- Given a text deceiption, a generative models can generate an image

---

## Large Language Models

**A large langauge mode (LLM)** is a subset of generative models focused primarily on text. An LLM takes a sequences of words as input and aims to predict the most likely sequence to follow. It assigns probabilities to potential next sequences and then selecs one. The model continues to generate sequences until meets a specified stopping criterion.

LLMs learn by traning on massive collections of written text, which means they will be better suited to some use cases than others. For example, a model trained on Github data would understand the probabilties of sequences in source code partiulary well.

However, it's crucial to understand LLM's limitions. When asked about less known or absent information, like the birthday of perosnal relative, LLM might "hallucinate" or make up information. It's essential to conside how well-represented the information you need in the model. 

---

## Embedding Models

An **embedding model** is used to convert complex data (like words or images) into a dense vector (a list of numbers) representation, known as an emedding. Unlike generative models, embedding models do not generate new text or data. Instead, they provide representations of semantic and syntactic relationsships between entities that can be used as input for other models or other natural language processing tasks.

---

## Streaming 

Streaming conversational text UIs (like ChatGPT) have gained massive popularity over the past few months. this section the benefits and drawbacks of streaming and block interfaces

**Large language models (LLM)** are extremely powerful. However, when generating long outputs they can very slow compared to the latency you're likely used to. If you try to build a traditional blocking UI, your users might easily find themselves staring at loading spinners for 5, 10 even up to 40s waiting for the entire LLM response to be generated. This can lead to a poor user experience, espeically in conversational applicaitons like chatbots. Streaming UIs can help mitigate this issue by displaying parts of the response as the become available 

---

## Workflow Patterns

Combine the building blocks with these patterns to add structure and reliability to your agents

- **Sequential Processing** - Steps executed in order
- **Parallel Processing** - Independent tasks run simultaneously
- **Evaluation/Feedback Loops** - Result checked improved iteratively 
- **Orchestration** - Coordinating multiple components
- **Routing** - Directing work based on context 

covered in `ai-agent.service.ts`
Resources https://ai-sdk.dev/docs/agents/workflows

