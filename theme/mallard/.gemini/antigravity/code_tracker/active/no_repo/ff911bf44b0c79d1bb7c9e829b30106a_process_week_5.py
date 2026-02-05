ã6import os
import re

source_file = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 5 content follows.txt"
output_dir = r"c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/Week 5"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Define the top-level sections
sections = [
    {
        "id": "5.1.1",
        "marker": "5.1.1 Gender Equality in STEM & Politics, which is made of five chapters:",
        "base_filename": "5.1.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Foundations_of_Gender_Equality",
            "The_Leaky_Pipeline",
            "Barriers_to_Entry_and_Progression",
            "Retention_Challenges_and_Workplace_Culture",
            "Intersectionality_in_STEM"
        ]
    },
    {
        "id": "5.1.2",
        "marker": "5.1.2 Evidencing the Leaky Pipeline:",
        "filename": "5.1.2_Evidencing_the_Leaky_Pipeline.html",
        "is_book": False
    },
    {
        "id": "5.1.3",
        "marker": "5.1.3 Revealing the Hidden Curriculum:",
        "filename": "5.1.3_Revealing_the_Hidden_Curriculum.html",
        "is_book": False
    },
    {
        "id": "5.2.1",
        "marker": "5.2.1 The Influence and Impact of Women on Politics and Policy:, which is made up of three chapters",
        "base_filename": "5.2.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Historical_Context_and_Representation",
            "Prominent_Figures_and_Their_Impact",
            "Policy_and_Legislative_Frameworks"
        ]
    },
    {
        "id": "5.2.2",
        "marker": "then 5.2.2 Analysing Impact and Effectiveness of Prominent Women in STEM:",
        "filename": "5.2.2_Analysing_Impact_and_Effectiveness_of_Prominent_Women_in_STEM.html",
        "is_book": False
    },
    {
        "id": "5.2.3",
        "marker": "Then 5.2.3 Policy Proposal Workshop:",
        "filename": "5.2.3_Policy_Proposal_Workshop.html",
        "is_book": False
    },
    {
        "id": "5.3.1",
        "marker": "5.3.1 Advancing Gender Equality Through Strategy, which is made of 4 chapters",
        "base_filename": "5.3.1_Chapter",
        "is_book": True,
        "chapter_names": [
            "Educational_Interventions_and_Outreach",
            "Inclusive_Workplaces_and_Retention",
            "Government_Policy_and_Systemic_Levers",
            "Advocacy_Allyship_and_Visibility"
        ]
    },
    {
        "id": "5.3.2",
        "marker": "Next is 5.3.2 Hidden Curriculum Module Design:",
        "filename": "5.3.2_Hidden_Curriculum_Module_Design.html",
        "is_book": False
    },
    {
        "id": "5.3.3",
        "marker": "Then, 5.3.3 Bias Audit of a Job Description:",
        "filename": "5.3.3_Bias_Audit_of_a_Job_Description.html",
        "is_book": False
    },
    {
        "id": "5.3.4",
        "marker": "And next is 5.3.4 Comparative Policy Analysis:",
        "filename": "5.3.4_Comparative_Policy_Analysis.html",
        "is_book": False
    },
    {
        "id": "5.4.1",
        "marker": "5.4.1 The Continued Pursuit of Gender Equality in STEM and Politics:",
        "filename": "5.4.1_The_Continued_Pursuit_of_Gender_Equality_in_STEM_and_Politics.html",
        "is_book": False
    },
    {
        "id": "5.4.2",
        "marker": "And 5.4.2 Online Encyclopaedia Entry Award Nomination:",
        "filename": "5.4.2_Online_Encyclopaedia_Entry_Award_Nomination.html",
        "is_book": False
    },
    {
        "id": "5.5.1",
        "marker": "5.5.1 Week 5 Conclusions: Women in STEM and Politics:",
        "filename": "5.5.1_Week_5_Conclusions.html",
        "is_book": False
    }
]

# Find start indices
for i, section in enumerate(sections):
    start_idx = content.find(section["marker"])
    if start_idx == -1:
        print(f"Error: Marker not found for {section['id']}")
        continue
    
    # The content starts AFTER the marker line. 
    # We can find the end of the marker line.
    marker_end_idx = start_idx + len(section["marker"])
    
    # Find the start of the NEXT section to define the end of this one
    if i < len(sections) - 1:
        next_marker = sections[i+1]["marker"]
        end_idx = content.find(next_marker)
        if end_idx == -1:
             print(f"Error: Next marker not found for section after {section['id']}")
             end_idx = len(content)
    else:
        end_idx = len(content)
    
    section_content = content[marker_end_idx:end_idx].strip()
    
    if section["is_book"]:
        # Split by chapters
        # Chapters look like "Chapter X: <!-- ... -->" or "Chapter X: <div..."
        # We can regex split, but we need to keep the content associated with each.
        
        # Let's find all "Chapter \d+:" occurrences
        chapter_pattern = re.compile(r'(Chapter \d+:.*)')
        parts = chapter_pattern.split(section_content)
        
        # parts[0] might be empty or whitespace if the first chapter starts immediately
        # parts[1] is "Chapter 1: ...", parts[2] is content of ch1, parts[3] is "Chapter 2: ...", etc.
        
        current_chapter_idx = 0
        
        # Skip preamble if any (usually empty or just whitespace)
        start_k = 1 if not parts[0].strip() else 0
        
        # If the split didn't work as expected (e.g. no chapters found), warn
        if len(parts) < 2:
             print(f"Warning: No chapters found in {section['id']}")
             # Fallback: write entire content to one file if chapters not found?
             # Or just skip.
             continue

        for k in range(1, len(parts), 2):
            if current_chapter_idx >= len(section["chapter_names"]):
                break
                
            header = parts[k] # e.g. "Chapter 1: <!-- ... -->"
            body = parts[k+1] if k+1 < len(parts) else ""
            
            # Clean header: remove "Chapter \d+:"
            clean_header = re.sub(r'Chapter \d+:', '', header).strip()
            
            full_chapter_content = clean_header + "\n" + body
            full_chapter_content = full_chapter_content.strip()
            
            chapter_name = section["chapter_names"][current_chapter_idx]
            fname = f"{section['id']}_Chapter_{current_chapter_idx+1}_{chapter_name}.html"
            
            with open(os.path.join(output_dir, fname), 'w', encoding='utf-8') as out_f:
                out_f.write(full_chapter_content)
            
            print(f"Created {fname}")
            current_chapter_idx += 1
            
    else:
        # Single file
        with open(os.path.join(output_dir, section["filename"]), 'w', encoding='utf-8') as out_f:
            out_f.write(section_content)
        print(f"Created {section['filename']}")

print("Processing complete.")
ã6*cascade082@file:///c:/Users/ucqnrwi/AntiGemini/Moodle/EDI/process_week_5.py