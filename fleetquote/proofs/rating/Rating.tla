------------------------------- MODULE Rating -------------------------------
(* The fleet quote lifecycle the rating twin (rulebooks/rating/twin.js) models, *)
(* written for TLC. One quote; the clock is a whole day the observer may set to  *)
(* any value in 0..Horizon, earlier ones included. A refused command changes     *)
(* nothing, so it is not a step here. The rating book's answer is abstracted to  *)
(* the outcome the submission drives: rated, referred or declined.               *)
EXTENDS Integers

CONSTANTS Horizon, Validity

Days     == 0..Horizon
None     == -1
Outcomes == {"rated", "referred", "declined"}
Live     == {"QUOTED", "REFERRED", "APPROVED"}
Decided  == {"DECLINED", "BOUND"}

VARIABLES status, outcome, ratedOn, day, boundFrom, boundLate
vars == <<status, outcome, ratedOn, day, boundFrom, boundLate>>

(* Expiry is derived, never stored: still valid on day Validity, expired after. *)
Expired == ratedOn # None /\ status \in Live /\ day - ratedOn > Validity

TypeOK ==
    /\ status \in {"NEW", "SUBMITTED", "QUOTED", "REFERRED", "APPROVED", "DECLINED", "BOUND"}
    /\ outcome \in Outcomes \cup {"none"}
    /\ ratedOn \in Days \cup {None}
    /\ day \in Days
    /\ boundFrom \in {"none", "QUOTED", "APPROVED"}
    /\ boundLate \in BOOLEAN

Init ==
    /\ status = "NEW"
    /\ outcome = "none"
    /\ ratedOn = None
    /\ day = 0
    /\ boundFrom = "none"
    /\ boundLate = FALSE

Submit(o) ==
    /\ status = "NEW"
    /\ status' = "SUBMITTED"
    /\ outcome' = o
    /\ UNCHANGED <<ratedOn, day, boundFrom, boundLate>>

(* A re-rate is a fresh rating: it re-stamps the date and drops any approval. *)
Rate ==
    /\ status \notin {"NEW"} \cup Decided
    /\ ratedOn' = day
    /\ status' = CASE outcome = "declined" -> "DECLINED"
                   [] outcome = "referred" -> "REFERRED"
                   [] OTHER                -> "QUOTED"
    /\ UNCHANGED <<outcome, day, boundFrom, boundLate>>

Approve ==
    /\ status = "REFERRED"
    /\ ~Expired
    /\ status' = "APPROVED"
    /\ UNCHANGED <<outcome, ratedOn, day, boundFrom, boundLate>>

Bind ==
    /\ status \in {"QUOTED", "APPROVED"}
    /\ ~Expired
    /\ status' = "BOUND"
    /\ boundFrom' = status
    /\ boundLate' = Expired
    /\ UNCHANGED <<outcome, ratedOn, day>>

ObserveAsOf(d) ==
    /\ day' = d
    /\ UNCHANGED <<status, outcome, ratedOn, boundFrom, boundLate>>

Next ==
    \/ \E o \in Outcomes : Submit(o)
    \/ Rate
    \/ Approve
    \/ Bind
    \/ \E d \in Days : ObserveAsOf(d)

Fairness == WF_vars(Rate) /\ SF_vars(Approve) /\ SF_vars(Bind)

Spec == Init /\ [][Next]_vars /\ Fairness

ApprovedNeverBindsAfterExpiry == boundFrom = "APPROVED" => ~boundLate

SubmittedReachesDecision == status = "SUBMITTED" ~> status \in Decided

=============================================================================
