export function arcadeClickerSource(projectName: string): string {
    return `import { _decorator, Color, Component, Graphics, HorizontalTextAlignment, Label, Layers, Node, UITransform, Vec3, VerticalTextAlignment } from 'cc';

const { ccclass } = _decorator;

@ccclass('ArcadeClicker')
export class ArcadeClicker extends Component {
    private score = 0;
    private timeLeft = 30;
    private scoreLabel: Label | null = null;
    private timerLabel: Label | null = null;
    private target: Node | null = null;
    private restart: Node | null = null;

    protected onLoad(): void {
        this.node.layer = Layers.Enum.UI_2D;
        this.buildInterface();
        this.startRound();
    }

    private buildInterface(): void {
        const background = this.graphicsNode('Background', 960, 640, new Color(22, 28, 45, 255));
        this.node.addChild(background);
        background.setSiblingIndex(0);

        const title = this.labelNode(${JSON.stringify(projectName)}, 40, new Color(242, 246, 255, 255));
        title.setPosition(0, 255);
        this.node.addChild(title);

        const scoreNode = this.labelNode('Score: 0', 30, new Color(103, 232, 249, 255));
        scoreNode.setPosition(-330, 205);
        this.node.addChild(scoreNode);
        this.scoreLabel = scoreNode.getComponent(Label);

        const timerNode = this.labelNode('Time: 30', 30, new Color(251, 191, 36, 255));
        timerNode.setPosition(330, 205);
        this.node.addChild(timerNode);
        this.timerLabel = timerNode.getComponent(Label);

        this.target = this.graphicsNode('Target', 130, 130, new Color(244, 63, 94, 255), true);
        this.node.addChild(this.target);
        this.target.on(Node.EventType.TOUCH_END, this.hitTarget, this);

        this.restart = this.graphicsNode('Restart', 240, 76, new Color(34, 197, 94, 255));
        this.restart.addChild(this.labelNode('Play Again', 28, Color.WHITE));
        this.restart.setPosition(0, -220);
        this.restart.on(Node.EventType.TOUCH_END, this.startRound, this);
        this.node.addChild(this.restart);
    }

    private graphicsNode(name: string, width: number, height: number, color: Color, circle = false): Node {
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(width, height);
        const graphics = node.addComponent(Graphics);
        graphics.fillColor = color;
        if (circle) graphics.circle(0, 0, Math.min(width, height) / 2);
        else graphics.roundRect(-width / 2, -height / 2, width, height, 18);
        graphics.fill();
        return node;
    }

    private labelNode(text: string, fontSize: number, color: Color): Node {
        const node = new Node('Label');
        node.layer = Layers.Enum.UI_2D;
        node.addComponent(UITransform).setContentSize(500, fontSize + 24);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = fontSize;
        label.lineHeight = fontSize + 8;
        label.color = color;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        return node;
    }

    private startRound(): void {
        this.unscheduleAllCallbacks();
        this.score = 0;
        this.timeLeft = 30;
        if (this.target) this.target.active = true;
        if (this.restart) this.restart.active = false;
        this.updateLabels();
        this.moveTarget();
        this.schedule(() => {
            this.timeLeft -= 1;
            this.updateLabels();
            if (this.timeLeft <= 0) this.finishRound();
        }, 1);
    }

    private hitTarget(): void {
        if (this.timeLeft <= 0) return;
        this.score += 1;
        this.updateLabels();
        this.moveTarget();
    }

    private moveTarget(): void {
        if (!this.target) return;
        this.target.setPosition(new Vec3(-350 + Math.random() * 700, -130 + Math.random() * 280, 0));
    }

    private finishRound(): void {
        this.unscheduleAllCallbacks();
        if (this.target) this.target.active = false;
        if (this.restart) this.restart.active = true;
        if (this.timerLabel) this.timerLabel.string = 'Finished!';
    }

    private updateLabels(): void {
        if (this.scoreLabel) this.scoreLabel.string = \`Score: \${this.score}\`;
        if (this.timerLabel) this.timerLabel.string = \`Time: \${this.timeLeft}\`;
    }
}
`;
}
