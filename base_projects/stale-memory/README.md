 <!DOCTYPE html>

[ Skip to main content ](#main-content) 

[   Go to Anthropic ](/r/Anthropic/) 

[r/Anthropic](/r/Anthropic/) • 

[coolreddy](/user/coolreddy/) 

#  I solved Claude's stale memory problem. Open sourced it.

 If you use Claude Code regularly, you’ve probably had this: you spend a session working out your stack, your patterns, the “never do X again” rules, your preferences. But once you start a fresh chat, Claude is back to proposing the exact thing you ruled out, stating your preferences again and again.

 So I built a completely local truly persistent memory that carries across all sessions and carries across cross platforms if you are like me using both Codex and Claude.

[GitHub Repo](https://github.com/Arkya-AI/ember-mcp) 

**What it feels like as a user** 

* You tell Claude your stack / preferences once. A week later, in new chat, it will still remember. No “remind me what DB you’re using?” energy.​
* When you change your mind or preferences (Tailwind → CSS Modules, REST → GraphQL), the old preference naturally fades instead of randomly resurfacing three weeks later.
* You can also bounce between Claude Code, Cursor, Windsurf, Codex and it behaves like one brain. What you teach in one place carries over everywhere.​

**Under the hood:** 

* Every “memory” (decision, preference, fact) is a node with an embedding, timestamp (builds temporal ability), and metadata (source file, client, tags). Retrieval runs a top‑k search over these embeddings first.
* When a new memory contradicts an old one, Ember creates an edge and raises the old node’s **shadow\_load** in \[0,1\]\[0,1\]. Higher shadow\_load means the node gets penalized in ranking instead of deleted.
* Final ranking score is something like: score=sim(query,node)×recency\_boost×(1−shadow\_load)_score_\=_sim_(_query_,_node_)×_recency_\_ _boost_×(1−_shadow_\_ _load_) so fresh, frequently‑touched memories beat stale ones even if they’re semantically similar.
* The graph (plus a bounded BFS around top hits) pulls in related context (e.g., design decision + linked trade‑offs + related bugs) instead of returning one isolated fact.

 GitHub: <https://github.com/Arkya-AI/ember-mcp> (MIT)

 Have been using it for a week and feels great. Let me know what you think.

 Read more 

 Share 

#  Related Answers Section

 Related Answers

 Latest breakthroughs in AI ethics

 Latest breakthroughs in AI ethics include discussions around the ethical implications of AI in various fields, the development of ethical frameworks, and concerns about AI's impact on society. Here are some key points and insights from Redditors on these topics:

### Ethical Frameworks and Principles

* **Decentralized Governance**: Some believe that decentralized governance could be a promising approach to managing AI ethics. ["This doesn't strike me as an 'unsettling' approach at all...the broad guidance across all industries is governance with external auditors (NIST, EU AI Act, etc essentially)." ](https://www.reddit.com/r/learnmachinelearning/comments/1phnk4k/comment/nt024g3/)
* **Falsifiable AI Ethics Core**: A new ethical core that is falsifiable and testable has been proposed to ensure AI behaves safely. ["It’s a short 'safety spine' for AI: when the stakes are high and information is shaky, it tells the system to avoid irreversible harm, prefer reversible options, and clearly log what it knows and why it acted (or refused)." ](https://www.reddit.com/r/OpenAI/comments/1q15829/comment/nx5087w/)

### AI in Research and Art

* **Research Ethics**: There is a debate on the ethical use of AI in research, especially when it comes to analytical tasks. ["AI isn't replacing research yet. You used it as advanced programming tech. You vibe coded. Yes keep doing that, you need to be as efficient as possible and focus on whatever hard parts can't be done by AI." ](https://www.reddit.com/r/Ethics/comments/1ns95jx/comment/ngkotdp/)
* **AI Art**: The discussion around AI art often revolves around the definition of art and the role of human creativity. ["To the degree that producing AI art employs no particular special skill, it isn’t an art. This is exactly what most people mean when they say that AI 'art' isn’t art." ](https://www.reddit.com/r/artificial/comments/1lsd9tj/comment/n1hog58/)

### Future Concerns and Predictions

* **AI and Human Identity**: Concerns about AI taking away what makes us human are frequently raised. ["There’s no denying that AI is extremely useful, but it feels as they’re taking away what makes us human." ](https://www.reddit.com/r/NoStupidQuestions/comments/1mtuyqt/where%5Fshould%5Fwe%5Fdraw%5Fthe%5Fethical%5Fline%5Ffor%5Fai/)
* **Potential for Misuse**: There is a fear that AI could be misused, for example, in manipulating animal communication. ["Never occurred to me that if humans decode animal speech, they will use it to manipulate animals for the benefit of humans." ](https://www.reddit.com/r/TrueReddit/comments/1r23e70/comment/o4xkyxw/)

### AI and General Ethics

* **Bias and Fairness**: AI’s ability to learn from data can lead to biased outcomes if the data itself is biased. ["If the data is biased, the results are biased. If the rules are unclear, decisions may be unfair." ](https://www.reddit.com/r/artificial/comments/1o0wgge/the%5Ftruth%5Fabout%5Fai%5Fethics%5Fchallenges%5Fand%5Ffuture/)
* **Ethical Reasoning in AI**: Some believe that AI should be enabled to understand ethics rather than just follow predefined rules. ["Given that models possess no ethics (in the sense of a true understanding of good and evil) but merely follow biases imposed by developers, forcing them toward THEIR version of ethics, isn't it reasonable to think the right approach is enabling models to comprehend its true?" ](https://www.reddit.com/r/agi/comments/1p9l9nr/the%5Findustry%5Fis%5Fracing%5Ffor%5Fagi%5Fbut%5Fwe%5Fmight%5Fbe/)

 These discussions highlight the ongoing efforts to address the ethical challenges posed by AI and ensure that AI development aligns with human values and societal well-being.

### AI Ethics Communities

 <<rtjson>>{"c":\[{"e":"ra:subreddit","id":"t5\_9gr4gn"},{"e":"ra:subreddit","id":"t5\_2qp8u"},{"e":"ra:subreddit","id":"t5\_2x21z"},{"e":"ra:subreddit","id":"t5\_2qyt6"},{"e":"ra:subreddit","id":"t5\_2qh8m"},{"e":"ra:subreddit","id":"t5\_2qhfb"}\],"content\_type":"subreddit","e":"ra:grid"}<</rtjson>>

[  See Answer ](https://www.reddit.com/answers/e348c98b-c5c2-415e-98ce-725aa6e9691f/?q=Latest+breakthroughs+in+AI+ethics&source=PDP) 

[ Best programming languages for AI development ](https://www.reddit.com/answers/92c6ebfc-c23c-4c27-a3e6-61e9be75645f/?q=Best+programming+languages+for+AI+development&source=PDP) 

[ Impact of AI on job markets ](https://www.reddit.com/answers/2a9b5af7-e77f-4bf0-8f63-90cf059b3e9b/?q=Impact+of+AI+on+job+markets&source=PDP) 

[ Innovative applications of AI in healthcare ](https://www.reddit.com/answers/08f3456a-828d-4888-bfa7-1f36516668a5/?q=Innovative+applications+of+AI+in+healthcare&source=PDP) 

[ Future trends in artificial intelligence ](https://www.reddit.com/answers/39c28bf9-af3e-4329-a741-bf2759c7db24/?q=Future+trends+in+artificial+intelligence&source=PDP) 

New to Reddit? 

 Create your account and connect with a world of communities.

 Continue with Email 

 Continue With Phone Number 

By continuing, you agree to our [User Agreement](https://www.redditinc.com/policies/user-agreement) and acknowledge that you understand the [Privacy Policy](https://www.redditinc.com/policies/privacy-policy).

  

[Talk to Claude](https://claude.ai/chats) 

 Public

Anyone can view, post, and comment to this community

0 0 

[Reddit Rules](https://www.redditinc.com/policies/content-policy) [Privacy Policy](https://www.reddit.com/policies/privacy-policy) [User Agreement](https://www.redditinc.com/policies/user-agreement) [Accessibility](https://support.reddithelp.com/hc/sections/38303584022676-Accessibility) [Reddit, Inc. © 2026\. All rights reserved.](https://redditinc.com) 

